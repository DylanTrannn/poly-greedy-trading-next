import { loadAppConfig, type DigestRunEvent } from '@/lib/shared';
import { scanCandidateMarkets } from '@/lib/polymarket/scanner';
import type { DigestDetail } from '@/lib/shared';
import { buildScanResult } from './build-scan-result';
import { setLastRunError, setLastRunSuccess } from './run-status';

export type RunProgressCallback = (event: DigestRunEvent) => void;

export async function runDailyDigest(
  onProgress?: RunProgressCallback,
): Promise<DigestDetail> {
  const emit = (event: DigestRunEvent) => onProgress?.(event);

  try {
    const config = loadAppConfig();

    emit({
      type: 'trace',
      message: `Scan window: ${config.nearCloseMaxHours}h · min prob ${(config.minOutcomeProb * 100).toFixed(0)}% · up to ${config.maxMarketsPerDigest} markets`,
    });

    emit({
      type: 'step',
      phase: 'scan',
      message: 'Querying Polymarket (Gamma API)…',
      page: 0,
      maxPages: config.scanMaxPages,
      candidates: 0,
    });

    const candidates = await scanCandidateMarkets(config, (p) => {
      emit({
        type: 'step',
        phase: 'scan',
        message: `Gamma page ${p.page}/${p.maxPages} — ${p.eventsOnPage} events, ${p.candidatesSoFar} candidates so far`,
        page: p.page,
        maxPages: p.maxPages,
        candidates: p.candidatesSoFar,
      });
    });

    emit({
      type: 'step',
      phase: 'filter',
      message: `Aggregated & filtered — ${candidates.length} market(s) (AI analysis on demand)`,
      candidates: candidates.length,
    });

    const digest = buildScanResult(candidates, config);

    emit({
      type: 'step',
      phase: 'done',
      message: `Found ${digest.matchCount} market(s) for ${digest.digestDate}`,
      candidates: digest.matchCount,
    });
    emit({ type: 'complete', digest });

    setLastRunSuccess(digest.runAt, digest.matchCount);
    return digest;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit({ type: 'error', message });
    setLastRunError(new Date().toISOString(), message);
    throw err;
  }
}
