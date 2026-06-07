export function buildPolymarketUrl(eventSlug: string, marketSlug?: string): string {
  const base = `https://polymarket.com/event/${eventSlug}`;
  if (marketSlug && marketSlug !== eventSlug) {
    return `${base}/${marketSlug}`;
  }
  return base;
}
