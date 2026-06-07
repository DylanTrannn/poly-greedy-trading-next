import type { OutcomeQuote } from '@/lib/shared';

/** Treat 99.9%+ as "100%" for filter purposes. */
const FULL_PRICE_EPS = 0.999;

/** Skip resolved/degenerate markets where every outcome (and Yes/No pair) is ~100%. */
export function isAllOutcomesFullyPriced(outcomes: OutcomeQuote[]): boolean {
  if (!outcomes.length) return false;
  return outcomes.every((o) => {
    if (o.noPrice != null) {
      return o.price >= FULL_PRICE_EPS && o.noPrice >= FULL_PRICE_EPS;
    }
    return o.price >= FULL_PRICE_EPS;
  });
}
