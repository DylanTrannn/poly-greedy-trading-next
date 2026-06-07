import type { AppConfig, CandidateMarket, MarketKind } from '@/lib/shared';
import { fetchEventsPage, parseJsonArray, type GammaEvent, type GammaMarket } from './client';
import { buildPolymarketUrl } from './links';
import { isAllOutcomesFullyPriced } from './filters';
import { aggregateNegRiskSubMarkets } from './neg-risk';
import { isUpDownMarket } from './up-down';

export type ScanProgressEvent = {
  page: number;
  maxPages: number;
  eventsOnPage: number;
  candidatesSoFar: number;
};

export type ScanProgressCallback = (event: ScanProgressEvent) => void;

function parseEndDate(endDate: string): Date {
  return new Date(endDate.replace('Z', '+00:00'));
}

function hoursUntil(endDate: string, now = new Date()): number {
  return (parseEndDate(endDate).getTime() - now.getTime()) / (1000 * 60 * 60);
}

function classifyMarketKind(
  event: GammaEvent,
  market: GammaMarket,
  outcomes: string[],
): MarketKind {
  if (outcomes.length > 2) return 'multi_outcome_clob';
  const subCount = event.markets?.length ?? 0;
  if (event.negRisk && subCount > 1) return 'neg_risk_sub_market';
  if (subCount > 1 && market.groupItemTitle) return 'neg_risk_sub_market';
  return 'binary';
}

function marketToCandidate(event: GammaEvent, market: GammaMarket, now: Date): CandidateMarket | null {
  if (market.closed) return null;

  const outcomeNames = parseJsonArray<string>(market.outcomes);
  const priceRaw = parseJsonArray<string>(market.outcomePrices);
  if (!outcomeNames.length || !priceRaw.length || outcomeNames.length !== priceRaw.length) {
    return null;
  }

  const outcomes = outcomeNames.map((name, i) => ({
    name,
    price: Number.parseFloat(priceRaw[i] ?? '0'),
  }));

  if (outcomes.some((o) => Number.isNaN(o.price))) return null;

  const leadingIdx = outcomes.reduce(
    (best, o, i) => (o.price > outcomes[best].price ? i : best),
    0,
  );
  const leading = outcomes[leadingIdx];
  const endDate = market.endDate ?? event.endDate;
  if (!endDate || !event.slug || !market.slug) return null;

  const hours = hoursUntil(endDate, now);
  const eventSlug = event.slug;
  const marketSlug = market.slug;

  return {
    marketKind: classifyMarketKind(event, market, outcomeNames),
    eventTitle: event.title ?? market.question ?? eventSlug,
    eventSlug,
    marketSlug,
    groupItemTitle: market.groupItemTitle || undefined,
    question: market.question ?? event.title ?? '',
    description: market.description,
    outcomes,
    leadingOutcome: leading.name,
    leadingPrice: leading.price,
    hoursUntilEnd: hours,
    negRisk: Boolean(event.negRisk),
    liquidity: Number(market.liquidity ?? 0),
    volume24hr: Number(market.volume24hr ?? 0),
    url: buildPolymarketUrl(eventSlug, marketSlug),
    endDate,
  };
}

function passesFilters(candidate: CandidateMarket, config: AppConfig): boolean {
  if (candidate.hoursUntilEnd <= 0 || candidate.hoursUntilEnd > config.nearCloseMaxHours) {
    return false;
  }
  if (candidate.leadingPrice < config.minOutcomeProb) return false;
  if (candidate.liquidity < config.minLiquidity) return false;
  if (candidate.volume24hr < config.minVolume24hr) return false;
  return true;
}

function dedupeByEvent(candidates: CandidateMarket[], maxPerEvent: number): CandidateMarket[] {
  const byEvent = new Map<string, CandidateMarket[]>();
  for (const c of candidates) {
    const list = byEvent.get(c.eventSlug) ?? [];
    list.push(c);
    byEvent.set(c.eventSlug, list);
  }

  const result: CandidateMarket[] = [];
  for (const list of byEvent.values()) {
    const sorted = [...list].sort((a, b) => {
      if (b.leadingPrice !== a.leadingPrice) return b.leadingPrice - a.leadingPrice;
      return a.hoursUntilEnd - b.hoursUntilEnd;
    });
    result.push(...sorted.slice(0, maxPerEvent));
  }
  return result;
}

export async function scanCandidateMarkets(
  config: AppConfig,
  onProgress?: ScanProgressCallback,
): Promise<CandidateMarket[]> {
  const now = new Date();
  const endDateMax = new Date(now.getTime() + config.nearCloseMaxHours * 60 * 60 * 1000);
  const candidates: CandidateMarket[] = [];
  const limit = Math.min(Math.max(config.gammaPageLimit, 1), 100);
  let offset = 0;
  const maxPages = Math.max(config.scanMaxPages, 1);

  while (offset / limit < maxPages) {
    const events = await fetchEventsPage(offset, limit, {
      endDateMin: now,
      endDateMax,
    });
    if (!events.length) break;

    onProgress?.({
      page: offset / limit + 1,
      maxPages,
      eventsOnPage: events.length,
      candidatesSoFar: candidates.length,
    });

    for (const event of events) {
      const markets = event.markets ?? [];
      for (const market of markets) {
        const candidate = marketToCandidate(event, market, now);
        if (!candidate) continue;
        if (isUpDownMarket(candidate)) continue;
        if (isAllOutcomesFullyPriced(candidate.outcomes)) continue;
        if (passesFilters(candidate, config)) {
          candidates.push(candidate);
        }
      }
    }

    offset += limit;
    if (events.length < limit) break;
  }

  const aggregated = aggregateNegRiskSubMarkets(candidates).filter(
    (c) => !isAllOutcomesFullyPriced(c.outcomes),
  );
  const deduped = dedupeByEvent(aggregated, config.maxPerEvent);
  return deduped
    .sort((a, b) => {
      if (a.hoursUntilEnd !== b.hoursUntilEnd) return a.hoursUntilEnd - b.hoursUntilEnd;
      return b.leadingPrice - a.leadingPrice;
    })
    .slice(0, config.maxMarketsPerDigest);
}

export function candidateId(c: CandidateMarket): string {
  return `${c.eventSlug}::${c.marketSlug}`;
}
