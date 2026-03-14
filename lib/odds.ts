export function americanToDecimal(americanOdds: number): string {
  if (!americanOdds || Number.isNaN(americanOdds)) return "";

  const decimal =
    americanOdds > 0
      ? americanOdds / 100 + 1
      : 100 / Math.abs(americanOdds) + 1;

  return decimal.toFixed(2);
}