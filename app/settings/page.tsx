'use client';

import { useEffect, useState } from 'react';
import type { AppConfig } from '@/lib/shared/types';
import { fetchConfig, runDigestNow } from '@/lib/api-client';

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchConfig().then(setConfig);
  }, []);

  async function handleRun() {
    setRunning(true);
    setMessage(null);
    try {
      const d = await runDigestNow();
      setMessage(
        `Done — ${d.matchCount} markets found for ${d.digestDate}. Open Scan to review them.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-zinc-500">
        Thresholds come from environment variables (local <code className="text-zinc-400">.env</code>{' '}
        or Vercel project settings). Redeploy after changes on Vercel.
      </p>

      {config && (
        <dl className="rounded-xl border border-zinc-800 divide-y divide-zinc-800 text-sm">
          {[
            ['Near-close window', `${config.nearCloseMaxHours} hours`],
            ['Min outcome probability', `${(config.minOutcomeProb * 100).toFixed(0)}%`],
            ['Min liquidity', `$${config.minLiquidity}`],
            ['Min 24h volume', `$${config.minVolume24hr}`],
            ['Max markets per scan', String(config.maxMarketsPerDigest)],
            ['Max picks per event', String(config.maxPerEvent)],
            ['Gamma scan pages', String(config.scanMaxPages)],
            ['Gamma page size', String(config.gammaPageLimit)],
            ['Digest timezone', config.digestTimezone],
            ['AI model', config.openrouterModel],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-3">
              <dt className="text-zinc-400">{k}</dt>
              <dd className="text-zinc-200 font-mono text-xs">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={running}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {running ? 'Running scan…' : 'Run scan now'}
        </button>
        {message && <p className="text-sm text-zinc-400">{message}</p>}
      </div>

      <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-500 space-y-2">
        <p className="font-medium text-zinc-300">AI analysis (optional)</p>
        <p>
          Set <code className="text-zinc-400">OPENROUTER_API_KEY</code> to enable Analyze with AI on
          market cards. Without it, scans still work and analysis shows leading-price fallback text.
        </p>
      </div>
    </div>
  );
}
