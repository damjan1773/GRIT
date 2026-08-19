export const colors = {
  mint: '#8FE9CE',
  lav: '#C5BEF5',
  mid: '#B7DCEC',
  bg: '#0a0a0b',
  card: '#17171A',
  cardBorder: 'rgba(255,255,255,0.07)',
  cardBorderStrong: 'rgba(255,255,255,0.14)',
  white: '#ffffff',
  textDim: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.38)',
  textFainter: 'rgba(255,255,255,0.42)',
  navIconDark: '#101012',
  mintSoftBg: 'rgba(143,233,206,0.13)',
  gradSoft: 'rgba(143,233,206,0.20)',
};

// Approximates the design's 115deg linear-gradient(mint, mid 48%, lav)
export const gradientColors: [string, string, string] = [colors.mint, colors.mid, colors.lav];
export const gradientLocations: [number, number, number] = [0, 0.48, 1];
export const gradientAngle = { start: { x: 0, y: 0.3 }, end: { x: 1, y: 0.7 } };

export const softGradientColors: [string, string] = ['rgba(143,233,206,0.22)', 'rgba(197,190,245,0.20)'];
