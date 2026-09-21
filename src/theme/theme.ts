import { chartColors, colors } from './colors';

export type ThemeMode = 'dark' | 'light';

/**
 * The page-and-ink half of the palette — the only part that flips between
 * themes. Accents (mint, lavender, the gradients and the dark #101012 text that
 * sits on them) are shared by both and live in colors.ts.
 */
export interface Theme {
  mode: ThemeMode;
  /** Page background. */
  bg: string;
  /** Cards, inputs and idle chips — one step off the page. */
  surface: string;
  /** Primary text and icons. */
  text: string;
  /** The text colour at an opacity: secondary text, hairlines, tracks. */
  ink: (alpha: number) => string;
  /**
   * Mint as an icon or text colour on the page or a card. The brand mint is
   * nearly invisible on white, so the light theme uses the darker chart step.
   * Mint as a fill (macro boxes, gradients) stays the brand mint in both themes.
   */
  accent: string;
  statusBar: 'light' | 'dark';
}

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#0a0a0b',
  surface: '#17171A',
  text: '#ffffff',
  ink: alpha => `rgba(255,255,255,${alpha})`,
  accent: colors.mint,
  statusBar: 'light',
};

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#ffffff',
  // Not pure white, or cards would vanish into the page.
  surface: '#F2F2F5',
  text: '#0a0a0b',
  ink: alpha => `rgba(10,10,11,${alpha})`,
  accent: chartColors.nutrition,
  statusBar: 'dark',
};

/** A plain-white accent chip needs an edge to stay visible on a white page. */
export function whiteChipEdge(theme: Theme) {
  return theme.mode === 'light' ? { borderWidth: 1, borderColor: theme.ink(0.1) } : null;
}
