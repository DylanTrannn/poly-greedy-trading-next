'use client';

import { useApiReady } from '@/hooks/useApiReady';
import { useRunDigest } from '@/hooks/useRunDigest';
import { DigestView } from './DigestView';
import { RunProgressTrace } from './RunProgressTrace';

type ScanNowPanelProps = {
  prominent?: boolean;
  onSuccess?: () => void;
};

export function ScanNowPanel({ prominent = false, onSuccess }: ScanNowPanelProps) {
  const { ready: apiReady } = useApiReady();
  const { running, error, digest, run, progressLines } = useRunDigest();

  async function handleClick() {
    const result = await run();
    if (result) onSuccess?.();
  }

  const showInlineResults = digest && !running;

  return (
    <div className="space-y-6">
      <div className={prominent ? 'text-center space-y-4' : 'flex flex-wrap items-center justify-between gap-4'}>
        {prominent && (
          <div>
            <h1 className="text-2xl font-bold">Scan markets now</h1>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
              Fetches near-close Polymarket picks live from the Gamma API. Use{' '}
              <strong className="text-zinc-400 font-medium">Analyze with AI</strong> on
              individual cards when you want a curator opinion.
            </p>
          </div>
        )}
        {!prominent && (
          <p className="text-sm text-zinc-500">
            Results are live only — use Analyze on cards you care about.
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleClick()}
          disabled={running || !apiReady}
          className={
            prominent
              ? 'rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed'
          }
        >
          {running ? 'Scanning…' : !apiReady ? 'Waiting for API…' : 'Scan now'}
        </button>
      </div>

      {(running || progressLines.length > 0) && (
        <RunProgressTrace lines={progressLines} running={running} />
      )}

      {error && (
        <p className="rounded-lg bg-red-950/50 border border-red-900 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {showInlineResults && (
        <div className="space-y-4">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Results — {digest.digestDate}</h2>
          </div>
          <DigestView digest={digest} />
        </div>
      )}
    </div>
  );
}
