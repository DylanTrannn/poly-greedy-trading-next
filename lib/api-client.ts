import type {
  AppConfig,
  AnalyzeItemEvent,
  DigestDetail,
  DigestItemRecord,
  DigestRunEvent,
} from '@/lib/shared';
import { consumeSse } from '@/lib/sse-client';

const API = '/api';

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error('Request failed — check your connection and try again.');
  }
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await apiFetch(`${API}/config`);
  if (!res.ok) throw new Error('Failed to load config');
  return res.json();
}

export async function runDigestNow(): Promise<DigestDetail> {
  const res = await apiFetch(`${API}/scan`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to run scan');
  }
  return res.json();
}

export async function runDigestWithProgress(
  onEvent: (event: DigestRunEvent) => void,
): Promise<DigestDetail> {
  let digest: DigestDetail | null = null;

  await consumeSse<DigestRunEvent>(
    `${API}/scan?stream=1`,
    { method: 'POST' },
    (ev) => {
      onEvent(ev);
      if (ev.type === 'complete') digest = ev.digest;
      if (ev.type === 'error') throw new Error(ev.message);
    },
  );

  if (!digest) throw new Error('Scan finished without a result');
  return digest;
}

export async function analyzeMarketWithProgress(
  item: DigestItemRecord,
  onEvent: (event: AnalyzeItemEvent) => void,
): Promise<DigestItemRecord> {
  let result: DigestItemRecord | null = null;

  await consumeSse<AnalyzeItemEvent>(
    `${API}/markets/analyze?stream=1`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item }),
    },
    (ev) => {
      onEvent(ev);
      if (ev.type === 'complete') result = ev.item;
      if (ev.type === 'error') throw new Error(ev.message);
    },
  );

  if (!result) throw new Error('Analysis finished without a result');
  return result;
}
