import type { AppConfig } from './types';

function envNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function loadAppConfig(): AppConfig {
  return {
    nearCloseMaxHours: envNumber('NEAR_CLOSE_MAX_HOURS', 4),
    minOutcomeProb: envNumber('MIN_OUTCOME_PROB', 0.96),
    minLiquidity: envNumber('MIN_LIQUIDITY', 0),
    minVolume24hr: envNumber('MIN_VOLUME_24H', 0),
    maxMarketsPerDigest: envNumber('MAX_MARKETS_PER_DIGEST', 100),
    maxPerEvent: envNumber('MAX_PER_EVENT', 1),
    scanMaxPages: envNumber('SCAN_MAX_PAGES', 50),
    gammaPageLimit: envNumber('GAMMA_PAGE_LIMIT', 100),
    digestTimezone: process.env.DIGEST_TIMEZONE ?? 'Asia/Ho_Chi_Minh',
    openrouterModel:
      process.env.OPENROUTER_MODEL ?? 'openrouter/google/gemini-2.5-flash',
  };
}
