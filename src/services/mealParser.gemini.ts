import { MEAL_PARSER_API_KEY, MEAL_PARSER_MODEL } from '../config/aiConfig';
import { MealParserError } from './mealParserError';
import { MealParseItem, MealParseResult, MealUnit, stepFor, sumTotals } from './mealParser.types';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
/** A call takes a few seconds; a phone on a slow connection needs room beyond that. */
const TIMEOUT_MS = 40_000;
/** The model reports "high demand" often enough to be worth one quiet retry. */
const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const RETRY_DELAY_MS = 1500;

/** Amounts in grams with macros per 100 g, so the card can edit in 10 g steps. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          unit: { type: 'string', enum: ['g', 'ml', 'kom'] },
          amount: { type: 'number' },
          perCalories: { type: 'number' },
          perProtein: { type: 'number' },
          perCarbs: { type: 'number' },
          perFats: { type: 'number' },
        },
        required: ['name', 'unit', 'amount', 'perCalories', 'perProtein', 'perCarbs', 'perFats'],
      },
    },
  },
  required: ['items'],
};

function buildPrompt(text: string): string {
  return [
    'Ti si nutricionista. Razloži opis obroka na pojedinačne namirnice i proceni makronutrijente.',
    'Za svaku namirnicu vrati:',
    '- name: naziv namirnice na srpskom (latinica), malim slovima',
    '- unit: "g" za namirnice koje se mere u gramima, "ml" za tečnosti, "kom" samo za komadne (jaje, kriška hleba, banana)',
    '- amount: ukupna količina koju je osoba pojela — broj grama, mililitara ili komada (ceo broj)',
    '- perCalories, perProtein, perCarbs, perFats: vrednosti na 100 g ili 100 ml, a za "kom" po JEDNOM komadu',
    'Primer: "300g kobasice" → unit "g", amount 300, perCalories oko 320 (na 100 g).',
    'Primer: "2 jajeta" → unit "kom", amount 2, perCalories oko 78 (po jajetu).',
    'Proteini, ugljeni hidrati i masti su u gramima. Koristi realne prosečne vrednosti.',
    'Ako količina nije navedena, pretpostavi jednu uobičajenu porciju.',
    'Ako u tekstu nema hrane, vrati praznu listu.',
    '',
    `Obrok: ${text}`,
  ].join('\n');
}

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
      // Whole numbers only: grams land on 10s, pieces on 1s, so +/- stays tidy.
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
    return new MealParserError('Gemini nije prihvatio ključ. Proveri EXPO_PUBLIC_MEAL_PARSER_API_KEY u .env.', body);
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
    return await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': MEAL_PARSER_API_KEY },
      body: JSON.stringify({
        model: MEAL_PARSER_MODEL,
        input: buildPrompt(text),
        response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
        // Pulling a few foods out of a sentence needs no deliberation, and the
        // deliberating is what made the call slow.
        generation_config: { thinking_level: 'low' },
      }),
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
  if (!MEAL_PARSER_API_KEY) {
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
