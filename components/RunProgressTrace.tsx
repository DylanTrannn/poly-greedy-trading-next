import type { DigestRunEvent } from '@/lib/shared';

type TraceLine = {
  id: string;
  kind: 'step' | 'trace' | 'error';
  message: string;
  active?: boolean;
};

export function RunProgressTrace({
  lines,
  running,
}: {
  lines: TraceLine[];
  running: boolean;
}) {
  if (!lines.length && !running) return null;

  return (
    <div
      className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm space-y-2"
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Scan progress
      </p>
      <ol className="space-y-1.5 font-mono text-xs">
        {lines.map((line) => (
          <li
            key={line.id}
            className={
              line.kind === 'error'
                ? 'text-red-300'
                : line.kind === 'trace'
                  ? 'text-zinc-500 pl-4'
                  : line.active
                    ? 'text-amber-200'
                    : 'text-zinc-300'
            }
          >
            <span className="inline-block w-4 text-zinc-600">
              {line.active ? '›' : line.kind === 'error' ? '✕' : '✓'}
            </span>
            {line.message}
          </li>
        ))}
        {running && lines.every((l) => !l.active) && (
          <li className="text-amber-200/80">
            <span className="inline-block w-4 text-zinc-600">›</span>
            Working…
          </li>
        )}
      </ol>
    </div>
  );
}

export function digestEventToLines(
  events: DigestRunEvent[],
  running: boolean,
): TraceLine[] {
  const lines: TraceLine[] = [];
  let n = 0;

  for (const ev of events) {
    if (ev.type === 'step') {
      const prev = lines[lines.length - 1];
      if (prev?.active) prev.active = false;
      lines.push({
        id: `step-${n++}`,
        kind: 'step',
        message: ev.message,
        active: running && ev.phase !== 'done',
      });
    } else if (ev.type === 'trace') {
      lines.push({
        id: `trace-${n++}`,
        kind: 'trace',
        message: ev.message,
      });
    } else if (ev.type === 'error') {
      lines.push({ id: `err-${n++}`, kind: 'error', message: ev.message });
    }
  }

  if (running && lines.length) {
    const last = lines[lines.length - 1];
    if (last.kind === 'step') last.active = true;
  }

  return lines;
}
