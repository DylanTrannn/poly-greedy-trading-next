import { randomUUID } from 'node:crypto';
import type {
  AppConfig,
  CandidateMarket,
  DigestDetail,
  DigestItemRecord,
} from '@/lib/shared';
import { formatIctDate } from '@/lib/shared/dates';
import { candidateId } from '@/lib/polymarket/scanner';

export function buildScanResult(
  candidates: CandidateMarket[],
  config: AppConfig,
): DigestDetail {
  const id = randomUUID();
  const runAt = new Date().toISOString();
  const digestDate = formatIctDate(new Date(), config.digestTimezone);

  const items: DigestItemRecord[] = candidates.map((c) => ({
    id: candidateId(c),
    digestId: id,
    marketKind: c.marketKind,
    eventTitle: c.eventTitle,
    eventSlug: c.eventSlug,
    marketSlug: c.marketSlug,
    groupItemTitle: c.groupItemTitle ?? null,
    question: c.question,
    outcomes: c.outcomes,
    leadingOutcome: c.leadingOutcome,
    leadingPrice: c.leadingPrice,
    hoursUntilEnd: c.hoursUntilEnd,
    liquidity: c.liquidity,
    volume24hr: c.volume24hr,
    url: c.url,
    recommendedOutcome: null,
    recommendedSide: null,
    confidence: null,
    reason: null,
    risks: [],
    agreesWithMarketPrice: null,
  }));

  return {
    id,
    digestDate,
    runAt,
    timezone: config.digestTimezone,
    matchCount: candidates.length,
    filters: { ...config },
    items,
  };
}
