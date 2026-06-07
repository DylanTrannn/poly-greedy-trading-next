import { NextRequest, NextResponse } from 'next/server';
import { runDailyDigest } from '@/lib/services/run-digest';
import { createSseStream, wantsEventStream } from '@/lib/sse-server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (wantsEventStream(request)) {
    return createSseStream(async (send) => {
      await runDailyDigest(async (event) => {
        await send(event);
      });
    });
  }

  try {
    const digest = await runDailyDigest();
    return NextResponse.json(digest);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
