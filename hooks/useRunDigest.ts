'use client';

import { useCallback, useState } from 'react';
import type { DigestDetail } from '@/lib/shared/types';
import type { DigestRunEvent } from '@/lib/shared';
import { runDigestWithProgress } from '@/lib/api-client';
import { digestEventToLines } from '@/components/RunProgressTrace';

export function useRunDigest() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [digest, setDigest] = useState<DigestDetail | null>(null);
  const [events, setEvents] = useState<DigestRunEvent[]>([]);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setEvents([]);
    try {
      const result = await runDigestWithProgress((ev) => {
        setEvents((prev) => [...prev, ev]);
        if (ev.type === 'error') {
          setError(ev.message);
        }
      });
      setDigest(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Scan failed';
      setError(message);
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  const progressLines = digestEventToLines(events, running);

  return { running, error, digest, setDigest, run, events, progressLines };
}
