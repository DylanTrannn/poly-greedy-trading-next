import { NextRequest } from 'next/server';

export function wantsEventStream(request: NextRequest): boolean {
  const accept = request.headers.get('Accept') ?? '';
  return request.nextUrl.searchParams.get('stream') === '1' || accept.includes('text/event-stream');
}

export function createSseStream<T>(
  run: (send: (payload: T) => Promise<void>) => Promise<void>,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = async (payload: T) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        await run(send);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
