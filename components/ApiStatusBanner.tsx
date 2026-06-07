'use client';

import { useApiReady } from '@/hooks/useApiReady';

export function ApiStatusBanner() {
  const { ready, checking } = useApiReady();

  if (ready) return null;

  return (
    <div
      className="border-b border-amber-900/60 bg-amber-950/40 px-4 py-2.5 text-center text-sm text-amber-200"
      role="status"
    >
      {checking
        ? 'Starting API…'
        : 'App starting — retry scan in a moment'}
    </div>
  );
}
