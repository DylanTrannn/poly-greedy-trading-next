import { jsonrepair } from 'jsonrepair';

function tryParseObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function tryParseObjectWithRepair(text: string): Record<string, unknown> | null {
  const direct = tryParseObject(text);
  if (direct) return direct;
  try {
    return tryParseObject(jsonrepair(text));
  } catch {
    return null;
  }
}

function collectFenceCandidates(raw: string): string[] {
  const out: string[] = [];
  const re = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null = re.exec(raw);
  while (m) {
    if (m[1]) out.push(m[1].trim());
    m = re.exec(raw);
  }
  return out;
}

function collectBalancedObjectCandidates(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (!ch) continue;

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === '}' && depth > 0) {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(raw.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return out;
}

/** Best-effort JSON object from model text (direct parse, then jsonrepair). */
export function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new SyntaxError('No JSON object found in model output');
  }

  const candidates: string[] = [];
  const seen = new Set<string>();
  const pushCandidate = (text: string) => {
    const t = text.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    candidates.push(t);
  };

  for (const c of collectFenceCandidates(trimmed)) pushCandidate(c);
  for (const c of collectBalancedObjectCandidates(trimmed)) pushCandidate(c);

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    pushCandidate(trimmed.slice(first, last + 1));
  }

  if (candidates.length === 0) {
    throw new SyntaxError('No JSON object found in model output');
  }

  for (const candidate of candidates) {
    const parsed = tryParseObjectWithRepair(candidate);
    if (parsed) return parsed;
  }

  throw new SyntaxError('Invalid JSON from model after repair');
}

/** Parse JSON string or object; repair truncated strings when needed. */
export function parseJsonValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const direct = tryParseObject(trimmed);
    if (direct) return direct;
    return JSON.parse(jsonrepair(trimmed));
  }
  return value;
}
