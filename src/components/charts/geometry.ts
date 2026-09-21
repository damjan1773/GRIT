/** Rounded data end, square foot on the baseline. */
const DATA_END_RADIUS = 4;

/** A column whose top corners are rounded and whose foot sits square on the baseline. */
export function columnPath(x: number, top: number, width: number, bottom: number): string {
  const r = Math.max(0, Math.min(DATA_END_RADIUS, width / 2, bottom - top));
  return (
    `M${x},${bottom}L${x},${top + r}` +
    `Q${x},${top} ${x + r},${top}L${x + width - r},${top}` +
    `Q${x + width},${top} ${x + width},${top + r}L${x + width},${bottom}Z`
  );
}
