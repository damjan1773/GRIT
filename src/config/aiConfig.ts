export type MealParserProvider = 'mock' | 'gemini';

/**
 * Swap the meal-parsing backend without touching call sites: set
 * EXPO_PUBLIC_MEAL_PARSER_PROVIDER in .env. Everything reads through
 * src/services/mealParser.ts.
 */
export const MEAL_PARSER_PROVIDER: MealParserProvider =
  (process.env.EXPO_PUBLIC_MEAL_PARSER_PROVIDER as MealParserProvider | undefined) ?? 'mock';

export const MEAL_PARSER_MODEL = process.env.EXPO_PUBLIC_MEAL_PARSER_MODEL ?? 'gemini-3.6-flash';

/**
 * When set (the web build on Vercel uses "/api/parse-meal"), meals go through
 * that server function, which holds the key — the page never sees it. Unset,
 * the app calls Gemini itself with the key below, as the phone app does.
 */
export const MEAL_PARSER_PROXY_URL = process.env.EXPO_PUBLIC_MEAL_PARSER_PROXY_URL ?? '';

/**
 * EXPO_PUBLIC_ variables are inlined into the app bundle, so this key ships
 * inside the app and can be read by anyone who has it. Fine while it's your
 * own build; before handing the app to anyone else the call belongs behind a
 * server that keeps the key.
 */
export const MEAL_PARSER_API_KEY = process.env.EXPO_PUBLIC_MEAL_PARSER_API_KEY ?? '';
