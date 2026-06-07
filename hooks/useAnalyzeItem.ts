'use client';

import { useCallback, useState } from 'react';
import type { DigestItemRecord } from '@/lib/shared/types';
import { analyzeMarketWithProgress } from '@/lib/api-client';

export function useAnalyzeItem() {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<string[]>([]);

  const analyze = useCallback(async (item: DigestItemRecord): Promise<DigestItemRecord | null> => {
    setAnalyzingId(item.id);
    setError(null);
    setTrace([]);
    try {
      return await analyzeMarketWithProgress(item, (ev) => {
        if (ev.type === 'step' || ev.type === 'trace') {
          setTrace((prev) => [...prev, ev.message]);
        }
        if (ev.type === 'error') setError(ev.message);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
      return null;
    } finally {
      setAnalyzingId(null);
    }
  }, []);

  return { analyzingId, error, trace, analyze };
}
