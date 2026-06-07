export type MarketKind = 'binary' | 'multi_outcome_clob' | 'neg_risk_sub_market';
export type RecommendedSide = 'buy_yes' | 'buy_no' | 'buy_outcome';
export type Confidence = 'high' | 'medium' | 'low';

export interface OutcomeQuote {
  name: string;
  /** Yes price, leading outcome price, or sole outcome price. */
  price: number;
  /** No price when the row is a neg-risk threshold (Yes/No pair). */
  noPrice?: number;
}

export interface CandidateMarket {
  marketKind: MarketKind;
  eventTitle: string;
  eventSlug: string;
  marketSlug: string;
  groupItemTitle?: string;
  question: string;
  description?: string;
  outcomes: OutcomeQuote[];
  leadingOutcome: string;
  leadingPrice: number;
  hoursUntilEnd: number;
  negRisk: boolean;
  liquidity: number;
  volume24hr: number;
  url: string;
  endDate: string;
}

export interface AiPickAnalysis {
  candidateId: string;
  recommendedOutcome: string;
  recommendedSide: RecommendedSide;
  confidence: Confidence;
  reason: string;
  risks: string[];
  agreesWithMarketPrice: boolean;
}

export interface DigestItemRecord {
  id: string;
  digestId: string;
  marketKind: MarketKind;
  eventTitle: string;
  eventSlug: string;
  marketSlug: string;
  groupItemTitle: string | null;
  question: string;
  outcomes: OutcomeQuote[];
  leadingOutcome: string;
  leadingPrice: number;
  hoursUntilEnd: number;
  liquidity: number;
  volume24hr: number;
  url: string;
  recommendedOutcome: string | null;
  recommendedSide: RecommendedSide | null;
  confidence: Confidence | null;
  reason: string | null;
  risks: string[];
  agreesWithMarketPrice: boolean | null;
}

export interface DigestSummary {
  id: string;
  digestDate: string;
  runAt: string;
  matchCount: number;
  preview: string[];
}

export interface DigestDetail {
  id: string;
  digestDate: string;
  runAt: string;
  timezone: string;
  matchCount: number;
  filters: Record<string, unknown>;
  items: DigestItemRecord[];
}

export interface AppConfig {
  nearCloseMaxHours: number;
  minOutcomeProb: number;
  minLiquidity: number;
  minVolume24hr: number;
  maxMarketsPerDigest: number;
  maxPerEvent: number;
  scanMaxPages: number;
  gammaPageLimit: number;
  digestTimezone: string;
  openrouterModel: string;
}
