/**
 * The Gemini request itself: endpoint, prompt and response schema. Plain data
 * with no app or React Native imports, so the app (calling Gemini directly) and
 * the web build's server function (api/parse-meal.ts, which holds the key) send
 * exactly the same request.
 */

export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

/** Longest meal description sent on; anything longer is not a meal. */
export const MAX_MEAL_TEXT_LENGTH = 1000;

/** Amounts in grams with macros per 100 g, so the card can edit in 5 g steps. */
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

/** The JSON body for one meal description. */
export function geminiRequestBody(text: string, model: string) {
  return {
    model,
    input: buildPrompt(text),
    response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
    // Pulling a few foods out of a sentence needs no deliberation, and the
    // deliberating is what made the call slow.
    generation_config: { thinking_level: 'low' },
  };
}
