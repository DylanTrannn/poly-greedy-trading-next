'use client';

import { useEffect, useState } from 'react';
import type { DigestDetail, DigestItemRecord } from '@/lib/shared/types';
import { formatIctDateTime } from '@/lib/shared/dates';
import { useAnalyzeItem } from '@/hooks/useAnalyzeItem';
import { MarketPickCard } from './MarketPickCard';

export function DigestView({ digest: initialDigest }: { digest: DigestDetail }) {
  const [digest, setDigest] = useState(initialDigest);
  const { analyzingId, analyze, trace, error: analyzeError } = useAnalyzeItem();

  useEffect(() => {
    setDigest(initialDigest);
  }, [initialDigest]);

  async function handleAnalyze(item: DigestItemRecord) {
    const updated = await analyze(item);
    if (updated) {
      setDigest((d) => ({
        ...d,
        items: d.items.map((i) => (i.id === updated.id ? updated : i)),
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          {digest.matchCount} market{digest.matchCount === 1 ? '' : 's'} · scanned{' '}
          {formatIctDateTime(new Date(digest.runAt))} · {digest.timezone}
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          AI analysis is optional — use Analyze on markets you want reviewed.
        </p>
      </div>

      {analyzeError && (
        <p className="rounded-lg bg-red-950/40 border border-red-900/80 px-3 py-2 text-sm text-red-300">
          {analyzeError}
        </p>
      )}

      {digest.items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500">
          <p>No markets matched your filters on this run.</p>
          <p className="mt-2 text-sm">
            Try again closer to market close, or loosen filters in Settings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {digest.items.map((item) => (
            <MarketPickCard
              key={item.id}
              item={item}
              analyzing={analyzingId === item.id}
              analyzeTrace={analyzingId === item.id ? trace : []}
              onAnalyze={() => void handleAnalyze(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
