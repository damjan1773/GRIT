import { MEAL_PARSER_PROVIDER } from '../config/aiConfig';
import { parseMealGemini } from './mealParser.gemini';
import { parseMealMock } from './mealParser.mock';
import { MealParseResult } from './mealParser.types';

export type { MealParseItem, MealParseResult } from './mealParser.types';

/**
 * Single entry point for turning free-text ("pojeo sam 2 jajeta i tost") into
 * structured macros. Isolated behind this function + MEAL_PARSER_PROVIDER so
 * the backend can be swapped through .env without touching any screen code.
 *
 * Throws on network or model trouble — the chat screen turns that into a message.
 */
export async function parseMealFromText(text: string): Promise<MealParseResult> {
  switch (MEAL_PARSER_PROVIDER) {
    case 'gemini':
      return parseMealGemini(text);
    case 'mock':
    default:
      return parseMealMock(text);
  }
}
