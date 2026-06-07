import type { CandidateMarket, OutcomeQuote } from '@/lib/shared';

function parseGroupSortKey(title: string): number {
  const digits = title.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return digits ? Number.parseFloat(digits[0]) : Number.NaN;
}

function sortGroupTitle(a: string, b: string): number {
  const na = parseGroupSortKey(a);
  const nb = parseGroupSortKey(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function subMarketOutcomes(sub: CandidateMarket): OutcomeQuote | null {
  const label = sub.groupItemTitle?.trim() || sub.question.trim();
  if (!label) return null;

  const yes = sub.outcomes.find((o) => o.name.toLowerCase() === 'yes');
  const no = sub.outcomes.find((o) => o.name.toLowerCase() === 'no');
  if (yes && no) {
    return { name: label, price: yes.price, noPrice: no.price };
  }

  if (sub.outcomes.length === 1) {
    return { name: label, price: sub.outcomes[0].price };
  }

  return {
    name: label,
    price: sub.leadingPrice,
  };
}

/** Merge neg-risk sub-markets into one row per event with all threshold prices. */
export function aggregateNegRiskSubMarkets(candidates: CandidateMarket[]): CandidateMarket[] {
  const negRiskByEvent = new Map<string, CandidateMarket[]>();
  const rest: CandidateMarket[] = [];

  for (const c of candidates) {
    if (c.marketKind === 'neg_risk_sub_market') {
      const list = negRiskByEvent.get(c.eventSlug) ?? [];
      list.push(c);
      negRiskByEvent.set(c.eventSlug, list);
    } else {
      rest.push(c);
    }
  }

  for (const subs of negRiskByEvent.values()) {
    if (subs.length === 1) {
      const only = subs[0];
      const row = subMarketOutcomes(only);
      if (row) {
        rest.push({ ...only, outcomes: [row] });
      } else {
        rest.push(only);
      }
      continue;
    }

    const sorted = [...subs].sort((a, b) =>
      sortGroupTitle(a.groupItemTitle ?? a.question, b.groupItemTitle ?? b.question),
    );

    const outcomes = sorted
      .map(subMarketOutcomes)
      .filter((o): o is OutcomeQuote => o != null);

    if (!outcomes.length) continue;

    const leadingSub = sorted.reduce((best, s) =>
      s.leadingPrice > best.leadingPrice ? s : best,
    );

    rest.push({
      ...leadingSub,
      groupItemTitle: undefined,
      question: leadingSub.eventTitle,
      outcomes,
      leadingOutcome: leadingSub.leadingOutcome,
      leadingPrice: leadingSub.leadingPrice,
      hoursUntilEnd: Math.min(...sorted.map((s) => s.hoursUntilEnd)),
      liquidity: sorted.reduce((sum, s) => sum + s.liquidity, 0),
      volume24hr: sorted.reduce((sum, s) => sum + s.volume24hr, 0),
      url: `https://polymarket.com/event/${leadingSub.eventSlug}`,
    });
  }

  return rest;
}
