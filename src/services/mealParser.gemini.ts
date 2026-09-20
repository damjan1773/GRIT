import { MEAL_PARSER_API_KEY, MEAL_PARSER_MODEL } from '../config/aiConfig';
import { MealParserError } from './mealParserError';
import { MealParseItem, MealParseResult } from './mealParser.types';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
/** A call takes a few seconds; a phone on a slow connection needs room beyond that. */
const TIMEOUT_MS = 40_000;
/** The model reports "high demand" often enough to be worth one quiet retry. */
const RETRY_STATUSES = new Set([500, 502, 503, 504]);
const RETRY_DELAY_MS = 1500;

/** Per-unit macros, so the confirm card's quantity steppers keep working. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          unitLabel: { type: 'string' },
          qty: { type: 'number' },
          unitCalories: { type: 'number' },
          unitProtein: { type: 'number' },
          unitCarbs: { type: 'number' },
          unitFats: { type: 'number' },
        },
        required: ['name', 'unitLabel', 'qty', 'unitCalories', 'unitProtein', 'unitCarbs', 'unitFats'],
      },
    },
  },
  required: ['items'],
};

function buildPrompt(text: string): string {
  return [
    'Ti si nutricionista. Razloži opis obroka na pojedinačne namirnice i proceni makronutrijente.',
    'Za svaku namirnicu vrati:',
    '- name: naziv namirnice na srpskom (latinica)',
    '- unitLabel: naziv jedne porcije, npr. "kom", "kriška", "100g", "šolja", "merica"',
    '- qty: koliko tih jedinica je osoba pojela',
    '- unitCalories, unitProtein, unitCarbs, unitFats: vrednosti za JEDNU jedinicu, ne za ukupnu količinu',
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
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

function toItems(parsed: any): MealParseItem[] {
  const raw = Array.isArray(parsed?.items) ? parsed.items : [];
  return raw
    .filter((item: any) => typeof item?.name === 'string' && item.name.trim())
    .map(
      (item: any): MealParseItem => ({
        name: String(item.name).trim(),
        unitLabel: typeof item.unitLabel === 'string' && item.unitLabel.trim() ? item.unitLabel.trim() : 'porcija',
        qty: Math.max(0.5, positive(item.qty) || 1),
        unitCalories: positive(item.unitCalories),
        unitProtein: positive(item.unitProtein),
        unitCarbs: positive(item.unitCarbs),
        unitFats: positive(item.unitFats),
      })
    );
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

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.unitCalories * item.qty,
      protein: acc.protein + item.unitProtein * item.qty,
      carbs: acc.carbs + item.unitCarbs * item.qty,
      fats: acc.fats + item.unitFats * item.qty,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return {
    name: items.map(item => item.name).join(' + '),
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fats: Math.round(totals.fats),
    items,
  };
}
