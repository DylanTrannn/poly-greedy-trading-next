let lastRun: { at: string; matchCount: number; error?: string } | null = null;

export function getLastRunStatus(): string {
  if (!lastRun) return 'No scans yet.';
  if (lastRun.error) {
    return `Last run: ${lastRun.at}\nStatus: failed\nError: ${lastRun.error}`;
  }
  return `Last run: ${lastRun.at}\nMatches: ${lastRun.matchCount}`;
}

export function setLastRunSuccess(at: string, matchCount: number): void {
  lastRun = { at, matchCount };
}

export function setLastRunError(at: string, error: string): void {
  lastRun = { at, matchCount: 0, error };
}
