import type { AnalyzeItemEvent, DigestItemRecord } from '@/lib/shared';
import { analyzeOneCandidate } from './analyze-candidates';
import { digestItemToCandidate } from './market-mapper';

export type AnalyzeProgressCallback = (event: AnalyzeItemEvent) => void;

export async function analyzeMarketItem(
  item: DigestItemRecord,
  onProgress?: AnalyzeProgressCallback,
): Promise<DigestItemRecord> {
  const emit = (event: AnalyzeItemEvent) => onProgress?.(event);

  emit({
    type: 'step',
    phase: 'start',
    message: `Preparing analysis for ${item.eventTitle}`,
  });

  const candidate = digestItemToCandidate(item);

  if (!process.env.OPENROUTER_API_KEY) {
    emit({
      type: 'trace',
      message: 'AI disabled — set OPENROUTER_API_KEY to enable curator analysis',
    });
  } else {
    emit({
      type: 'trace',
      message: 'Calling OpenRouter (single market — static curator instructions + market context)',
    });
  }

  emit({ type: 'step', phase: 'model', message: 'Curator agent analyzing…' });

  const analysis = await analyzeOneCandidate(candidate, (msg) => {
    emit({ type: 'trace', message: msg });
  });

  emit({ type: 'step', phase: 'parse', message: 'Applying AI pick…' });

  const updated: DigestItemRecord = {
    ...item,
    recommendedOutcome: analysis.recommendedOutcome,
    recommendedSide: analysis.recommendedSide,
    confidence: analysis.confidence,
    reason: analysis.reason,
    risks: analysis.risks ?? [],
    agreesWithMarketPrice: analysis.agreesWithMarketPrice,
  };

  emit({ type: 'step', phase: 'done', message: 'Analysis complete' });
  emit({ type: 'complete', item: updated });
  return updated;
}
