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
