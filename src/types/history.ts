import type { SplitMethod, TipResult } from './tipSplit';

export type HistoryEntry = {
  id: string;
  createdAt: string; // ISO 8601
  totalTipsCents: number;
  method: SplitMethod;
  workerCount: number;
  results: TipResult[];
};
