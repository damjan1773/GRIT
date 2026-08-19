import { MEAL_PARSER_PROVIDER } from '../config/aiConfig';
import { parseMealMock } from './mealParser.mock';
import { MealParseResult } from './mealParser.types';

export type { MealParseItem, MealParseResult } from './mealParser.types';

/**
 * Single entry point for turning free-text ("pojeo sam 2 jajeta i tost") into
 * structured macros. Isolated behind this function + MEAL_PARSER_PROVIDER so
 * the backend (mock now, a real model later) can be swapped via config/env
 * without touching any screen code.
 */
export async function parseMealFromText(text: string): Promise<MealParseResult> {
  switch (MEAL_PARSER_PROVIDER) {
    case 'mock':
    default:
      return parseMealMock(text);
    // case 'openai':
    //   return parseMealOpenAI(text);
    // case 'anthropic':
    //   return parseMealAnthropic(text);
  }
}
