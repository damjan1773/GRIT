import { MEAL_PARSER_API_KEY, MEAL_PARSER_MODEL, MEAL_PARSER_PROXY_URL } from '../config/aiConfig';
import { GEMINI_ENDPOINT, geminiRequestBody } from './geminiRequest';
import { MealParserError } from './mealParserError';
import { MealParseItem, MealParseResult, MealUnit, stepFor, sumTotals } from './mealParser.types';
/** A call takes a few seconds; a phone on a slow connection needs room beyond that. */
const TIMEOUT_MS = 40_000;
/** The model reports "high demand" often enough to be worth one quiet retry. */
const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const RETRY_DELAY_MS = 1500;

/** REST returns no output_text shortcut — the text sits in the model_output step. */
function extractText(payload: any): string {
  const shortcut = payload?.output_text ?? payload?.outputText;
  if (typeof shortcut === 'string' && shortcut.trim()) return shortcut;

  const steps: any[] = Array.isArray(payload?.steps) ? payload.steps : [];
  const ordered = [...steps].reverse();
  const modelOutput = ordered.find(s => s?.type === 'model_output') ?? ordered[0];
  const blocks = Array.isArray(modelOutput?.content) ? modelOutput.content : [modelOutput?.content];
  const text = blocks
    .map((b: any) => (typeof b === 'string' ? b : b?.text))
    .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
    .join('');
  if (!text) throw new MealParserError('Gemini je vratio prazan odgovor. Probaj ponovo.');
  return text;
}

/** Tolerates a model that wraps its JSON in prose or code fences. */
function parseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new MealParserError('Gemini nije vratio očekivani format. Probaj ponovo.', text.slice(0, 200));
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}

function positive(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
}

/** Anything not clearly weighed or poured is counted in pieces. */
function toUnit(raw: unknown): MealUnit {
  const text = String(raw ?? '').trim().toLowerCase();
  if (text.startsWith('ml') || text.includes('mililit')) return 'ml';
  if (text === 'g' || text.startsWith('g ') || text.includes('gram')) return 'g';
  return 'kom';
}

function toItems(parsed: any): MealParseItem[] {
  const raw = Array.isArray(parsed?.items) ? parsed.items : [];
  return raw
    .filter((item: any) => typeof item?.name === 'string' && item.name.trim())
    .map((item: any): MealParseItem => {
      const unit = toUnit(item.unit);
      const step = stepFor(unit);
      // Whole numbers only: grams land on 5s, pieces on 1s, so +/- stays tidy.
      const amount = Math.max(step, Math.round((Number(item.amount) || step) / step) * step);
      return {
        name: String(item.name).trim(),
        unit,
        amount,
        perCalories: positive(item.perCalories),
        perProtein: positive(item.perProtein),
        perCarbs: positive(item.perCarbs),
        perFats: positive(item.perFats),
      };
    });
}

/** Turns an HTTP status into something the user can act on. */
function errorForStatus(status: number, body: string): MealParserError {
  if (status === 401 || status === 403) {
    return new MealParserError(
      MEAL_PARSER_PROXY_URL
        ? 'Server nema ispravan Gemini ključ. Proveri GEMINI_API_KEY u podešavanjima na Vercel-u.'
        : 'Gemini nije prihvatio ključ. Proveri EXPO_PUBLIC_MEAL_PARSER_API_KEY u .env.',
      body
    );
  }
  if (status === 404) {
    return new MealParserError(`Model ${MEAL_PARSER_MODEL} nije dostupan tvom nalogu.`, body);
  }
  if (status === 429) {
    return new MealParserError('Potrošen je limit besplatnog Gemini naloga (5 u minuti, 20 dnevno). Probaj kasnije.', body);
  }
  if (RETRY_STATUSES.has(status)) {
    return new MealParserError('Gemini je trenutno preopterećen. Probaj ponovo za koji trenutak.', body);
  }
  return new MealParserError('Gemini je odbio zahtev.', `${status}: ${body}`);
}

async function callOnce(text: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Through the server function when one is set (the web build): the key stays
    // on the server and the page only sends the text. It answers with Gemini's
    // own status and body, so everything below reads the same either way.
    if (MEAL_PARSER_PROXY_URL) {
      return await fetch(MEAL_PARSER_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
    }
    return await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': MEAL_PARSER_API_KEY },
      body: JSON.stringify(geminiRequestBody(text, MEAL_PARSER_MODEL)),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new MealParserError('Gemini nije odgovorio na vreme. Probaj ponovo.');
    }
    throw new MealParserError('Nema veze sa Gemini servisom. Proveri internet.', String(error?.message ?? error));
  } finally {
    clearTimeout(timeout);
  }
}

export async function parseMealGemini(text: string): Promise<MealParseResult> {
  if (!MEAL_PARSER_PROXY_URL && !MEAL_PARSER_API_KEY) {
    throw new MealParserError('Nedostaje Gemini ključ u .env (EXPO_PUBLIC_MEAL_PARSER_API_KEY).');
  }

  let response = await callOnce(text);
  if (RETRY_STATUSES.has(response.status)) {
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    response = await callOnce(text);
  }

  if (!response.ok) {
    throw errorForStatus(response.status, (await response.text().catch(() => '')).slice(0, 300));
  }

  const items = toItems(parseJson(extractText(await response.json())));
  if (items.length === 0) {
    throw new MealParserError('Nisam prepoznao hranu u tome. Probaj npr. „150g piletine i šolja riže“.');
  }

  return { name: items.map(item => item.name).join(' + '), ...sumTotals(items), items };
}
