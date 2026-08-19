import { MealParseItem, MealParseResult } from './mealParser.types';

// Small reference table so the mock can produce plausible-looking (not just
// pure-random) numbers when it recognizes a common food word. Purely for a
// believable placeholder UI — has no bearing on the real parsing backend.
const KNOWN_FOODS: { aliases: string[]; name: string; unit: string; k: number; p: number; c: number; f: number }[] = [
  { aliases: ['jaje', 'jaja'], name: 'Jaje, kuvano', unit: 'kom', k: 78, p: 6.3, c: 0.6, f: 5.3 },
  { aliases: ['tost', 'hleb', 'kifl'], name: 'Tost hleb', unit: 'kriška', k: 80, p: 2.7, c: 14, f: 1 },
  { aliases: ['banan'], name: 'Banana', unit: 'kom', k: 105, p: 1.3, c: 27, f: 0.4 },
  { aliases: ['jabuk'], name: 'Jabuka', unit: 'kom', k: 95, p: 0.5, c: 25, f: 0.3 },
  { aliases: ['jogurt'], name: 'Grčki jogurt', unit: '100g', k: 97, p: 9, c: 3.9, f: 5 },
  { aliases: ['pilet', 'pilec', 'piletin'], name: 'Pileća prsa', unit: '100g', k: 165, p: 31, c: 0, f: 3.6 },
  { aliases: ['riz', 'pirinač'], name: 'Riža, kuvana', unit: '100g', k: 130, p: 2.7, c: 28, f: 0.3 },
  { aliases: ['ovsen', 'pahulj', 'musli'], name: 'Ovsene pahuljice', unit: '50g', k: 190, p: 6.6, c: 33, f: 3.4 },
  { aliases: ['avokad'], name: 'Avokado', unit: 'kom', k: 240, p: 3, c: 12, f: 22 },
  { aliases: ['kafa', 'kafu', 'espres'], name: 'Espreso', unit: 'šolja', k: 5, p: 0.3, c: 0, f: 0 },
  { aliases: ['sir', 'kackav', 'feta'], name: 'Sir', unit: '30g', k: 105, p: 7.5, c: 0.6, f: 8 },
  { aliases: ['losos', 'ribu', 'riba'], name: 'Losos', unit: '100g', k: 208, p: 20, c: 0, f: 13 },
  { aliases: ['salat'], name: 'Zelena salata', unit: '100g', k: 20, p: 1.4, c: 2.9, f: 0.2 },
  { aliases: ['sejk', 'protein', 'whey'], name: 'Proteinski šejk', unit: 'merica', k: 120, p: 24, c: 3, f: 1.5 },
  { aliases: ['pasta', 'testenin', 'makaron', 'spaget'], name: 'Pasta, kuvana', unit: '100g', k: 158, p: 5.8, c: 31, f: 0.9 },
  { aliases: ['mleko', 'mleka'], name: 'Mleko', unit: '100ml', k: 52, p: 3.4, c: 4.8, f: 2 },
  { aliases: ['pica', 'pice', 'picu'], name: 'Pica, kriška', unit: 'kom', k: 285, p: 12, c: 36, f: 10 },
];

function normalize(text: string): string {
  const map: Record<string, string> = { č: 'c', ć: 'c', ž: 'z', š: 's', đ: 'd' };
  return text.toLowerCase().replace(/[čćžšđ]/g, ch => map[ch] ?? ch);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function round(n: number): number {
  return Math.round(n);
}

function totalOf(item: MealParseItem) {
  return {
    calories: round(item.unitCalories * item.qty),
    protein: round(item.unitProtein * item.qty),
    carbs: round(item.unitCarbs * item.qty),
    fats: round(item.unitFats * item.qty),
  };
}

function genericItem(label: string): MealParseItem {
  // Reasonable single-serving placeholder range when nothing is recognized.
  const calories = randomBetween(180, 520);
  const protein = (randomBetween(0.08, 0.22) * calories) / 4;
  const fats = (randomBetween(0.15, 0.35) * calories) / 9;
  const carbsCalories = Math.max(0, calories - protein * 4 - fats * 9);
  const carbs = carbsCalories / 4;
  return {
    name: label,
    unitLabel: 'porcija',
    qty: 1,
    unitCalories: round(calories),
    unitProtein: round(protein),
    unitCarbs: round(carbs),
    unitFats: round(fats),
  };
}

/**
 * Placeholder "AI" parser: recognizes a handful of common food words and
 * otherwise falls back to randomized-but-plausible macros, so the
 * confirm/edit/save flow can be built and tested before a real model is wired
 * up through src/config/aiConfig.ts.
 */
export async function parseMealMock(text: string): Promise<MealParseResult> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 400));

  const normalized = normalize(text);
  const words = normalized.replace(/[.,;!?]/g, ' ').trim().split(/\s+/).filter(Boolean);

  const matched: MealParseItem[] = [];
  for (const food of KNOWN_FOODS) {
    const hit = food.aliases.some(alias => words.some(w => w.startsWith(alias)));
    if (!hit) continue;
    const qty = Math.max(1, Math.round(randomBetween(0.8, 2.4)));
    matched.push({
      name: food.name,
      unitLabel: food.unit,
      qty,
      unitCalories: food.k,
      unitProtein: food.p,
      unitCarbs: food.c,
      unitFats: food.f,
    });
  }

  const items = matched.length > 0 ? matched : [genericItem(text.trim() || 'Obrok')];

  const totals = items.reduce(
    (acc, it) => {
      const t = totalOf(it);
      return { calories: acc.calories + t.calories, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fats: acc.fats + t.fats };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return {
    name: items.map(it => it.name).join(' + '),
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fats: totals.fats,
    items,
  };
}
