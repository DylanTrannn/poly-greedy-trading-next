const GAMMA_BASE = 'https://gamma-api.polymarket.com';

export interface GammaMarket {
  id?: string;
  question?: string;
  slug?: string;
  description?: string;
  endDate?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  groupItemTitle?: string;
  liquidity?: number | string;
  volume24hr?: number | string;
  closed?: boolean;
  active?: boolean;
}

export interface GammaEvent {
  id?: string;
  title?: string;
  slug?: string;
  negRisk?: boolean;
  endDate?: string;
  markets?: GammaMarket[];
}

export function parseJsonArray<T>(value: string | T[] | undefined | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

export type FetchEventsOptions = {
  /** Only events/markets ending after this time (ISO sent to Gamma as end_date_min). */
  endDateMin?: Date;
  /** Only events/markets ending before this time (ISO sent to Gamma as end_date_max). */
  endDateMax?: Date;
};

export async function fetchEventsPage(
  offset: number,
  limit = 100,
  options?: FetchEventsOptions,
): Promise<GammaEvent[]> {
  const params = new URLSearchParams({
    active: 'true',
    closed: 'false',
    order: 'end_date',
    ascending: 'true',
    limit: String(limit),
    offset: String(offset),
  });
  if (options?.endDateMin) {
    params.set('end_date_min', options.endDateMin.toISOString());
  }
  if (options?.endDateMax) {
    params.set('end_date_max', options.endDateMax.toISOString());
  }
  const res = await fetch(`${GAMMA_BASE}/events?${params}`);
  if (!res.ok) {
    throw new Error(`Gamma API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as GammaEvent[];
}
