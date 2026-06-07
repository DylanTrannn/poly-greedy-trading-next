import { z } from 'zod';

function normalizeAnalysisItem(val: unknown): unknown {
  if (!val || typeof val !== 'object') return val;
  const o = val as Record<string, unknown>;
  const risks = Array.isArray(o.risks)
    ? o.risks.filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    : typeof o.risks === 'string' && o.risks.trim()
      ? [o.risks.trim()]
      : [];

  return {
    ...o,
    risks: risks.length > 0 ? risks : ['Verify resolution criteria on Polymarket'],
    agreesWithMarketPrice:
      typeof o.agreesWithMarketPrice === 'boolean' ? o.agreesWithMarketPrice : true,
  };
}

export function normalizeAnalysisBatch(val: unknown): unknown {
  if (!val || typeof val !== 'object') return val;
  const o = val as Record<string, unknown>;
  if (!Array.isArray(o.analyses)) return val;
  return {
    ...o,
    analyses: o.analyses.map(normalizeAnalysisItem),
  };
}

export const aiAnalysisItemSchema = z.preprocess(
  normalizeAnalysisItem,
  z.object({
    candidateId: z.string(),
    recommendedOutcome: z.string(),
    recommendedSide: z.enum(['buy_yes', 'buy_no', 'buy_outcome']),
    confidence: z.enum(['high', 'medium', 'low']),
    reason: z.string(),
    risks: z.array(z.string()),
    agreesWithMarketPrice: z.boolean(),
  }),
);

export const aiAnalysisBatchSchema = z.object({
  analyses: z.array(aiAnalysisItemSchema),
});

export type AiAnalysisBatch = z.infer<typeof aiAnalysisBatchSchema>;
