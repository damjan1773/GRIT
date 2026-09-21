/** Signed, with a decimal only when there is one: "+23", "+2,5", "−4". */
export function formatSignedAmount(value: number): string {
  return formatSigned(value, Number.isInteger(value) ? 0 : 1);
}

/** Serbian plural agreement: 1 serija, 3 serije, 5 serija — 11–14 take the "many" form. */
export function pluralSr(count: number, one: string, few: string, many: string): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (last === 1 && lastTwo !== 11) return one;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

/**
 * Signed number in Serbian formatting: "+0,27", "−500", "0". Values that round
 * to zero drop the sign, so nothing ever reads "−0,00".
 */
export function formatSigned(value: number, fractionDigits = 0): string {
  const magnitude = Math.abs(value);
  const text = magnitude.toLocaleString('sr-RS', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  if (Number(magnitude.toFixed(fractionDigits)) === 0) return text;
  return (value > 0 ? '+' : '−') + text;
}
