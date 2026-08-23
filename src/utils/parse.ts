export function parseDecimal(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

export function parseDollarsToCents(text: string): number {
  const value = parseDecimal(text.replace(/[^0-9.-]/g, ''));
  if (value === undefined) return 0;
  return Math.round(value * 100);
}
