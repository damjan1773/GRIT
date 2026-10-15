import { ThemeMode } from './theme';

/**
 * Category colours for the small icons beside list rows and cards, after the
 * system palette Apple uses in Health: one hue per kind of thing, so rows tell
 * themselves apart at a glance. Each has a step for either theme — the light
 * steps are darker where the system colour would wash out on white (yellow,
 * green, mint, cyan). These identify a row; data in charts keeps chartColors.
 */
export type IconHue =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'mint'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'brown';

const HUES: Record<IconHue, { dark: string; light: string }> = {
  red: { dark: '#FF453A', light: '#E5372B' },
  orange: { dark: '#FF9F0A', light: '#E07F00' },
  yellow: { dark: '#FFD60A', light: '#B88A00' },
  green: { dark: '#30D158', light: '#22A145' },
  mint: { dark: '#63E6E2', light: '#00A39A' },
  teal: { dark: '#40CBE0', light: '#1E95AA' },
  cyan: { dark: '#64D2FF', light: '#1C8FC7' },
  blue: { dark: '#0A84FF', light: '#007AFF' },
  indigo: { dark: '#5E5CE6', light: '#5856D6' },
  purple: { dark: '#BF5AF2', light: '#A04BD0' },
  pink: { dark: '#FF375F', light: '#E5294F' },
  brown: { dark: '#AC8E68', light: '#8E6F4A' },
};

export function iconHue(hue: IconHue, mode: ThemeMode): string {
  return HUES[hue][mode];
}
