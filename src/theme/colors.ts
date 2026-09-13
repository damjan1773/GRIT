/**
 * Accents shared by both themes. What flips between dark and light — page,
 * cards, text — is in theme.ts.
 */
export const colors = {
  mint: '#8FE9CE',
  lav: '#C5BEF5',
  mid: '#B7DCEC',
  /** The white macro chip — an accent, so it stays white in the light theme too. */
  white: '#ffffff',
};

// Approximates the design's 115deg linear-gradient(mint, mid 48%, lav)
export const gradientColors: [string, string, string] = [colors.mint, colors.mid, colors.lav];
export const gradientLocations: [number, number, number] = [0, 0.48, 1];
export const gradientAngle = { start: { x: 0, y: 0.3 }, end: { x: 1, y: 0.7 } };

export const softGradientColors: [string, string] = ['rgba(143,233,206,0.22)', 'rgba(197,190,245,0.20)'];
