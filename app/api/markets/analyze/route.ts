import { NextRequest, NextResponse } from 'next/server';
import { analyzeMarketItem } from '@/lib/services/analyze-item';
import { createSseStream, wantsEventStream } from '@/lib/sse-server';
import type { DigestItemRecord } from '@/lib/shared';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const item = body?.item as DigestItemRecord | undefined;
  if (!item || typeof item !== 'object') {
    return NextResponse.json(
      { error: 'Request body must include { item: DigestItemRecord }' },
      { status: 400 },
    );
  }

  if (wantsEventStream(request)) {
    return createSseStream(async (send) => {
      await analyzeMarketItem(item, async (event) => {
        await send(event);
      });
    });
  }

  try {
    const result = await analyzeMarketItem(item);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
