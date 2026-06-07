export async function consumeSse<T>(
  url: string,
  init: RequestInit,
  onEvent: (payload: T) => void,
): Promise<void> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'text/event-stream',
      ...init.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Request failed (${res.status})`,
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        onEvent(JSON.parse(json) as T);
      }
    }
  }
}
