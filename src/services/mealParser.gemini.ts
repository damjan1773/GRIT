import { MEAL_PARSER_API_KEY, MEAL_PARSER_MODEL } from '../config/aiConfig';
import { MealParseItem, MealParseResult } from './mealParser.types';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const TIMEOUT_MS = 20_000;

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

/** The REST response keeps the text in steps; SDKs expose an output_text shortcut. */
function extractText(payload: any): string {
  const shortcut = payload?.output_text ?? payload?.outputText ?? payload?.interaction?.output_text ?? payload?.interaction?.outputText;
  if (typeof shortcut === 'string' && shortcut.trim()) return shortcut;

  const steps: any[] = payload?.steps ?? payload?.interaction?.steps ?? [];
  const ordered = [...steps].reverse();
  const modelOutput = ordered.find(s => s?.type === 'model_output') ?? ordered[0];
  const blocks = Array.isArray(modelOutput?.content) ? modelOutput.content : [modelOutput?.content];
  const text = blocks
    .map((b: any) => (typeof b === 'string' ? b : b?.text))
    .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
    .join('');
  if (!text) throw new Error('Odgovor modela nema tekst.');
  return text;
}

/** Tolerates a model that wraps its JSON in prose or code fences. */
function parseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('Odgovor modela nije JSON.');
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

export async function parseMealGemini(text: string): Promise<MealParseResult> {
  if (!MEAL_PARSER_API_KEY) {
    throw new Error('Nedostaje EXPO_PUBLIC_MEAL_PARSER_API_KEY u .env.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': MEAL_PARSER_API_KEY },
      body: JSON.stringify({
        model: MEAL_PARSER_MODEL,
        input: buildPrompt(text),
        response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini ${response.status}: ${detail.slice(0, 200)}`);
  }

  const items = toItems(parseJson(extractText(await response.json())));
  if (items.length === 0) throw new Error('Model nije prepoznao nijednu namirnicu.');

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
