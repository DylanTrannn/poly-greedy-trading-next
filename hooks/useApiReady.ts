'use client';

import { useEffect, useState } from 'react';

const STATUS_URL = '/api/status';

export function useApiReady(pollMs = 2000) {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch(STATUS_URL);
        if (!cancelled) {
          setReady(res.ok);
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          setReady(false);
          setChecking(false);
        }
      }
    }

    void ping();
    const id = setInterval(() => void ping(), pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { ready, checking };
}
