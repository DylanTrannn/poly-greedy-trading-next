import type { DigestItemRecord, OutcomeQuote } from '@/lib/shared/types';
import {
  formatHoursUntilEnd,
  formatPriceCents,
} from '@/lib/shared/dates';

const kindLabels: Record<DigestItemRecord['marketKind'], string> = {
  binary: 'Binary',
  neg_risk_sub_market: 'Multi-option event',
  multi_outcome_clob: 'N-outcome',
};

function hasYesNoRows(outcomes: OutcomeQuote[]): boolean {
  return outcomes.some((o) => o.noPrice != null);
}

type MarketPickCardProps = {
  item: DigestItemRecord;
  analyzing?: boolean;
  analyzeTrace?: string[];
  onAnalyze?: () => void;
};

export function MarketPickCard({
  item,
  analyzing = false,
  analyzeTrace = [],
  onAnalyze,
}: MarketPickCardProps) {
  const hasAiAnalysis = Boolean(item.reason?.trim());
  const isAggregatedNegRisk =
    item.marketKind === 'neg_risk_sub_market' && hasYesNoRows(item.outcomes);
  const title = isAggregatedNegRisk
    ? item.eventTitle
    : item.groupItemTitle && item.marketKind === 'neg_risk_sub_market'
    ? item.eventTitle
    : item.question;

  return (
    <article className='rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <h3 className='text-lg font-semibold text-zinc-50'>{title}</h3>
          {item.groupItemTitle &&
            item.marketKind === 'neg_risk_sub_market' &&
            !isAggregatedNegRisk && (
              <span className='mt-1 inline-block rounded-full bg-emerald-950 px-2.5 py-0.5 text-xs text-emerald-300'>
                {item.groupItemTitle}
              </span>
            )}
        </div>
        <span className='rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400'>
          {kindLabels[item.marketKind]}
        </span>
      </div>

      {hasYesNoRows(item.outcomes) ? (
        <NegRiskOutcomeTable item={item} />
      ) : (
        <OutcomeLadder item={item} />
      )}

      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
        <ClosesInBadge hoursUntilEnd={item.hoursUntilEnd} />
        <span className='text-zinc-400'>
          Leading:{' '}
          <span className='text-zinc-200'>
            {item.leadingOutcome} @ {formatPriceCents(item.leadingPrice)}
          </span>
        </span>
        {item.liquidity > 0 && (
          <span className='text-zinc-500'>
            Liquidity: ${item.liquidity.toLocaleString()}
          </span>
        )}
      </div>

      {analyzing && analyzeTrace.length > 0 && (
        <div className='rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-mono text-zinc-500 space-y-0.5'>
          {analyzeTrace.map((line, i) => (
            <p key={`${i}-${line}`}>{line}</p>
          ))}
        </div>
      )}

      {hasAiAnalysis && (
        <div className='rounded-lg bg-zinc-950/80 p-4 space-y-2 text-sm'>
          <p className='font-medium text-emerald-400'>
            AI pick: {item.recommendedOutcome ?? item.leadingOutcome}
            {item.confidence && (
              <span className='ml-2 text-zinc-500'>
                ({item.confidence} confidence)
              </span>
            )}
          </p>
          {item.reason && <p className='text-zinc-300'>{item.reason}</p>}
          {item.risks.length > 0 && (
            <ul className='list-disc list-inside text-zinc-500 space-y-1'>
              {item.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onAnalyze && (
        <button
          type='button'
          onClick={onAnalyze}
          disabled={analyzing}
          className='rounded-lg border border-violet-500/40 bg-violet-950/40 px-3 py-1.5 text-sm font-medium text-violet-200 hover:bg-violet-900/50 disabled:opacity-50'
        >
          {analyzing
            ? 'Analyzing…'
            : hasAiAnalysis
            ? 'Re-analyze with AI'
            : 'Analyze with AI'}
        </button>
      )}

      <a
        href={item.url}
        target='_blank'
        rel='noreferrer'
        className='inline-flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300 ml-3'
      >
        Open on Polymarket →
      </a>
    </article>
  );
}

function ClosesInBadge({ hoursUntilEnd }: { hoursUntilEnd: number }) {
  const urgent = hoursUntilEnd < 1;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums ${
        urgent
          ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
          : 'border-sky-500/40 bg-sky-500/10 text-sky-200'
      }`}
      title='Time until market resolution'
    >
      Closes in {formatHoursUntilEnd(hoursUntilEnd)}
    </span>
  );
}

function NegRiskOutcomeTable({ item }: { item: DigestItemRecord }) {
  return (
    <div className='overflow-x-auto rounded-lg border border-zinc-800'>
      <table className='w-full text-xs'>
        <thead>
          <tr className='border-b border-zinc-800 bg-zinc-950/80 text-left text-zinc-500'>
            <th className='px-3 py-2 font-medium'>Outcome</th>
            <th className='px-3 py-2 font-medium text-right'>Yes</th>
            <th className='px-3 py-2 font-medium text-right'>No</th>
          </tr>
        </thead>
        <tbody>
          {item.outcomes.map((o) => {
            const lead = item.leadingOutcome.toLowerCase();
            const isLeadingYes =
              lead === 'yes' && o.price === item.leadingPrice;
            const isLeadingNo =
              lead === 'no' &&
              o.noPrice != null &&
              o.noPrice === item.leadingPrice;
            const rowLeading = isLeadingYes || isLeadingNo;
            return (
              <tr
                key={o.name}
                className={`border-b border-zinc-800/80 last:border-0 ${
                  rowLeading ? 'bg-emerald-950/30' : ''
                }`}
              >
                <td
                  className={`px-3 py-2 font-medium ${
                    rowLeading ? 'text-emerald-200' : 'text-zinc-300'
                  }`}
                >
                  {o.name}
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    isLeadingYes
                      ? 'text-emerald-300 font-semibold'
                      : 'text-zinc-400'
                  }`}
                >
                  {formatPriceCents(o.price)}
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    isLeadingNo
                      ? 'text-emerald-300 font-semibold'
                      : 'text-zinc-400'
                  }`}
                >
                  {o.noPrice != null ? formatPriceCents(o.noPrice) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OutcomeLadder({ item }: { item: DigestItemRecord }) {
  const max = Math.max(...item.outcomes.map((o) => o.price), 0.01);
  const showAllLabels = item.outcomes.length > 2;

  return (
    <div className='space-y-2'>
      {item.outcomes.map((o) => {
        const pct = (o.price / max) * 100;
        const isLeading = o.name === item.leadingOutcome;
        return (
          <div key={o.name} className='space-y-1'>
            <div className='flex justify-between text-xs'>
              <span
                className={
                  isLeading
                    ? 'text-emerald-300 font-medium'
                    : showAllLabels
                    ? 'text-zinc-300'
                    : 'text-zinc-400'
                }
              >
                {o.name}
              </span>
              <span
                className={
                  isLeading
                    ? 'text-emerald-300 font-semibold tabular-nums'
                    : 'text-zinc-500 tabular-nums'
                }
              >
                {formatPriceCents(o.price)}
              </span>
            </div>
            <div className='h-1.5 rounded-full bg-zinc-800 overflow-hidden'>
              <div
                className={`h-full rounded-full ${
                  isLeading ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
