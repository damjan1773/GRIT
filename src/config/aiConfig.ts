export type MealParserProvider = 'mock' | 'openai' | 'anthropic';

/**
 * Swap the meal-parsing backend without touching call sites: set
 * EXPO_PUBLIC_MEAL_PARSER_PROVIDER in .env (or app config `extra`) once a real
 * model is chosen. Everything reads through src/services/mealParser.ts.
 */
export const MEAL_PARSER_PROVIDER: MealParserProvider =
  (process.env.EXPO_PUBLIC_MEAL_PARSER_PROVIDER as MealParserProvider | undefined) ?? 'mock';

export const MEAL_PARSER_MODEL = process.env.EXPO_PUBLIC_MEAL_PARSER_MODEL ?? '';
export const MEAL_PARSER_API_KEY = process.env.EXPO_PUBLIC_MEAL_PARSER_API_KEY ?? '';
