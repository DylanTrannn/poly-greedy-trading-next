import type { DigestDetail, DigestItemRecord } from './types';

/** Server → client progress while running a market scan (no bulk AI). */
export type DigestRunEvent =
  | {
      type: 'step';
      phase: 'scan' | 'filter' | 'done';
      message: string;
      page?: number;
      maxPages?: number;
      candidates?: number;
    }
  | { type: 'trace'; message: string }
  | { type: 'complete'; digest: DigestDetail }
  | { type: 'error'; message: string };

/** Progress for on-demand AI on a single market item. */
export type AnalyzeItemEvent =
  | {
      type: 'step';
      phase: 'start' | 'model' | 'parse' | 'done';
      message: string;
    }
  | { type: 'trace'; message: string }
  | { type: 'complete'; item: DigestItemRecord }
  | { type: 'error'; message: string };
