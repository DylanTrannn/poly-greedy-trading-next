import {
  aiAnalysisBatchSchema,
  normalizeAnalysisBatch,
  type AiPickAnalysis,
  type CandidateMarket,
} from '@/lib/shared';
import { candidateId } from '@/lib/polymarket/scanner';
import { createCuratorAgent } from '@/lib/agents/curator-agent';
import { extractJsonObject, parseJsonValue } from '@/lib/parse-agent-json';

const CHUNK_SIZE = 5;
const MAX_CHUNK_ATTEMPTS = 3;

const JSON_REMINDER =
  'Return one JSON object: { "analyses": [ ... ] }. Every item MUST include candidateId, recommendedOutcome, recommendedSide, confidence, reason, risks (string array, at least 1), agreesWithMarketPrice (boolean).';

function fallbackAnalysis(c: CandidateMarket): AiPickAnalysis {
  const id = candidateId(c);
  return {
    candidateId: id,
    recommendedOutcome: c.leadingOutcome,
    recommendedSide:
      c.leadingOutcome === 'Yes'
        ? 'buy_yes'
        : c.leadingOutcome === 'No'
          ? 'buy_no'
          : 'buy_outcome',
    confidence: 'medium',
    reason:
      'AI analysis unavailable for this market; showing leading price only. Verify on Polymarket before trading.',
    risks: ['Verify resolution criteria on Polymarket', 'Prices can move before close'],
    agreesWithMarketPrice: true,
  };
}

function mergeChunkAnalyses(
  analyses: AiPickAnalysis[],
  chunk: CandidateMarket[],
): AiPickAnalysis[] {
  const byId = new Map(analyses.map((a) => [a.candidateId, a]));
  return chunk.map((c) => byId.get(candidateId(c)) ?? fallbackAnalysis(c));
}

function parseAnalysisBatch(raw: unknown, chunk: CandidateMarket[]): AiPickAnalysis[] | null {
  const normalized = normalizeAnalysisBatch(parseJsonValue(raw));
  const parsed = aiAnalysisBatchSchema.safeParse(normalized);
  if (!parsed.success) return null;
  return mergeChunkAnalyses(parsed.data.analyses, chunk);
}

function extractPartialFromAgentError(err: unknown): unknown | null {
  if (!err || typeof err !== 'object') return null;
  const details = (err as { details?: { value?: unknown } }).details;
  if (details?.value == null) return null;
  try {
    return parseJsonValue(details.value);
  } catch {
    return null;
  }
}

function responseRawObject(response: {
  object?: unknown;
  text?: string;
}): unknown {
  if (response.object != null) return response.object;
  if (response.text?.trim()) return extractJsonObject(response.text);
  return null;
}

async function analyzeChunk(
  agent: ReturnType<typeof createCuratorAgent>,
  chunk: CandidateMarket[],
): Promise<AiPickAnalysis[]> {
  const payload = chunk.map((c) => ({
    candidateId: candidateId(c),
    marketKind: c.marketKind,
    eventTitle: c.eventTitle,
    groupItemTitle: c.groupItemTitle,
    question: c.question,
    outcomes: c.outcomes,
    leadingOutcome: c.leadingOutcome,
    leadingPrice: c.leadingPrice,
    hoursUntilEnd: c.hoursUntilEnd,
    liquidity: c.liquidity,
    volume24hr: c.volume24hr,
    negRisk: c.negRisk,
    url: c.url,
  }));

  const prompt = `Analyze these near-close Polymarket candidates and return JSON matching the schema.\n\n${JSON.stringify(payload, null, 2)}`;

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_CHUNK_ATTEMPTS; attempt++) {
    const useStructured = attempt === 0;

    try {
      const response = useStructured
        ? await agent.generate(prompt, {
            structuredOutput: { schema: aiAnalysisBatchSchema },
          })
        : await agent.generate(`${prompt}\n\n${JSON_REMINDER}`);

      const raw = responseRawObject(response);
      const merged = raw != null ? parseAnalysisBatch(raw, chunk) : null;
      if (merged) return merged;
      lastError = new Error('Could not parse agent response');
    } catch (err) {
      lastError = err;

      const partial = extractPartialFromAgentError(err);
      if (partial != null) {
        const recovered = parseAnalysisBatch(partial, chunk);
        if (recovered) {
          console.warn(
            `[analyze] Recovered partial structured output for ${chunk.length} market(s)`,
          );
          return recovered;
        }
      }

      if (attempt < MAX_CHUNK_ATTEMPTS - 1) {
        console.warn(
          `[analyze] Attempt ${attempt + 1}/${MAX_CHUNK_ATTEMPTS} failed, retrying:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  console.warn(
    `[analyze] Using fallback for ${chunk.length} market(s) after failures:`,
    lastError instanceof Error ? lastError.message : lastError,
  );
  return chunk.map(fallbackAnalysis);
}

export type AnalyzeTraceCallback = (message: string) => void;

/** On-demand analysis for one market (stable agent instructions + dynamic market JSON). */
export async function analyzeOneCandidate(
  candidate: CandidateMarket,
  onTrace?: AnalyzeTraceCallback,
): Promise<AiPickAnalysis> {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      ...fallbackAnalysis(candidate),
      reason:
        'AI analysis skipped (OPENROUTER_API_KEY not set). Leading market price shown only.',
    };
  }

  onTrace?.('Structured output request to curator agent');
  const agent = createCuratorAgent();
  const [analysis] = await analyzeChunk(agent, [candidate]);
  onTrace?.('Response validated');
  return analysis;
}

export async function analyzeCandidates(
  candidates: CandidateMarket[],
): Promise<Map<string, AiPickAnalysis>> {
  const map = new Map<string, AiPickAnalysis>();
  if (!candidates.length) return map;

  if (!process.env.OPENROUTER_API_KEY) {
    for (const c of candidates) {
      const id = candidateId(c);
      map.set(id, {
        ...fallbackAnalysis(c),
        reason:
          'AI analysis skipped (OPENROUTER_API_KEY not set). Leading market price shown only.',
      });
    }
    return map;
  }

  const agent = createCuratorAgent();

  for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
    const chunk = candidates.slice(i, i + CHUNK_SIZE);
    const analyses = await analyzeChunk(agent, chunk);
    for (const a of analyses) {
      map.set(a.candidateId, a);
    }
  }

  return map;
}
