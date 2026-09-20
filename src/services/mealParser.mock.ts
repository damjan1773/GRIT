import { MealParseItem, MealParseResult, MealUnit, sumTotals } from './mealParser.types';

/**
 * Small reference table so the mock produces plausible-looking numbers when it
 * recognizes a common food word. Values are per 100 g / 100 ml, or per piece
 * for 'kom'. Purely a placeholder — the real work is in mealParser.gemini.
 */
const KNOWN_FOODS: {
  aliases: string[];
  name: string;
  unit: MealUnit;
  amount: number;
  per: [calories: number, protein: number, carbs: number, fats: number];
}[] = [
  { aliases: ['jaje', 'jaja'], name: 'jaje', unit: 'kom', amount: 2, per: [78, 6.3, 0.6, 5.3] },
  { aliases: ['tost', 'hleb', 'kifl'], name: 'hleb', unit: 'g', amount: 60, per: [265, 9, 49, 3.2] },
  { aliases: ['banan'], name: 'banana', unit: 'kom', amount: 1, per: [105, 1.3, 27, 0.4] },
  { aliases: ['jabuk'], name: 'jabuka', unit: 'kom', amount: 1, per: [95, 0.5, 25, 0.3] },
  { aliases: ['jogurt'], name: 'grčki jogurt', unit: 'g', amount: 150, per: [97, 9, 3.9, 5] },
  { aliases: ['pilet', 'pilec', 'piletin'], name: 'pileća prsa', unit: 'g', amount: 150, per: [165, 31, 0, 3.6] },
  { aliases: ['riz', 'pirinač'], name: 'riža, kuvana', unit: 'g', amount: 150, per: [130, 2.7, 28, 0.3] },
  { aliases: ['ovsen', 'pahulj', 'musli'], name: 'ovsene pahuljice', unit: 'g', amount: 50, per: [380, 13, 67, 7] },
  { aliases: ['avokad'], name: 'avokado', unit: 'kom', amount: 1, per: [240, 3, 12, 22] },
  { aliases: ['kafa', 'kafu', 'espres'], name: 'espreso', unit: 'ml', amount: 30, per: [17, 1, 0, 0] },
  { aliases: ['sir', 'kackav', 'feta'], name: 'sir', unit: 'g', amount: 30, per: [350, 25, 2, 28] },
  { aliases: ['losos', 'ribu', 'riba'], name: 'losos', unit: 'g', amount: 150, per: [208, 20, 0, 13] },
  { aliases: ['salat'], name: 'zelena salata', unit: 'g', amount: 100, per: [20, 1.4, 2.9, 0.2] },
  { aliases: ['sejk', 'protein', 'whey'], name: 'proteinski šejk', unit: 'kom', amount: 1, per: [120, 24, 3, 1.5] },
  { aliases: ['pasta', 'testenin', 'makaron', 'spaget'], name: 'pasta, kuvana', unit: 'g', amount: 200, per: [158, 5.8, 31, 0.9] },
  { aliases: ['mleko', 'mleka'], name: 'mleko', unit: 'ml', amount: 200, per: [52, 3.4, 4.8, 2] },
  { aliases: ['pica', 'pice', 'picu'], name: 'pica, kriška', unit: 'kom', amount: 2, per: [285, 12, 36, 10] },
];

function normalize(text: string): string {
  const map: Record<string, string> = { č: 'c', ć: 'c', ž: 'z', š: 's', đ: 'd' };
  return text.toLowerCase().replace(/[čćžšđ]/g, ch => map[ch] ?? ch);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function genericItem(label: string): MealParseItem {
  // Reasonable single-serving placeholder when nothing is recognized.
  const calories = Math.round(randomBetween(180, 520));
  const protein = Math.round((randomBetween(0.08, 0.22) * calories) / 4);
  const fats = Math.round((randomBetween(0.15, 0.35) * calories) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));
  return { name: label, unit: 'kom', amount: 1, perCalories: calories, perProtein: protein, perCarbs: carbs, perFats: fats };
}

/**
 * Placeholder parser: recognizes a handful of common food words and otherwise
 * falls back to a plausible single portion, so the confirm/edit/save flow can be
 * exercised offline and without burning API quota.
 */
export async function parseMealMock(text: string): Promise<MealParseResult> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 400));

  const words = normalize(text).replace(/[.,;!?]/g, ' ').trim().split(/\s+/).filter(Boolean);

  const matched: MealParseItem[] = [];
  for (const food of KNOWN_FOODS) {
    if (!food.aliases.some(alias => words.some(w => w.startsWith(alias)))) continue;
    const [perCalories, perProtein, perCarbs, perFats] = food.per;
    matched.push({ name: food.name, unit: food.unit, amount: food.amount, perCalories, perProtein, perCarbs, perFats });
  }

  const items = matched.length > 0 ? matched : [genericItem(text.trim() || 'obrok')];
  return { name: items.map(item => item.name).join(' + '), ...sumTotals(items), items };
}
