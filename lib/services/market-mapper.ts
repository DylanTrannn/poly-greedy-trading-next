import type { CandidateMarket, DigestItemRecord } from '@/lib/shared';

export function digestItemToCandidate(item: DigestItemRecord): CandidateMarket {
  return {
    marketKind: item.marketKind,
    eventTitle: item.eventTitle,
    eventSlug: item.eventSlug,
    marketSlug: item.marketSlug,
    groupItemTitle: item.groupItemTitle ?? undefined,
    question: item.question,
    outcomes: item.outcomes,
    leadingOutcome: item.leadingOutcome,
    leadingPrice: item.leadingPrice,
    hoursUntilEnd: item.hoursUntilEnd,
    negRisk: item.marketKind === 'neg_risk_sub_market',
    liquidity: item.liquidity,
    volume24hr: item.volume24hr,
    url: item.url,
    endDate: new Date(Date.now() + item.hoursUntilEnd * 3600_000).toISOString(),
  };
}
