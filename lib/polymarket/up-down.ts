import type { OutcomeQuote } from '@/lib/shared';

/** Short-horizon Up/Down crypto markets — excluded as too volatile. */
export function isUpDownMarket(input: {
  eventTitle: string;
  question: string;
  outcomes: OutcomeQuote[];
}): boolean {
  const text = `${input.eventTitle} ${input.question}`;
  if (/up\s+or\s+down/i.test(text)) return true;

  if (input.outcomes.length === 2) {
    const names = new Set(input.outcomes.map((o) => o.name.trim().toLowerCase()));
    if (names.has('up') && names.has('down')) return true;
  }

  return false;
}
