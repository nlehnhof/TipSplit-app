export type SplitMethod = 'equal' | 'hours' | 'points' | 'weightedHours';

export type Worker = {
  id: string;
  name: string;
  role?: string;
};

export type WorkerInput = {
  workerId: string;
  name: string;
  role?: string;
  hours?: number;
  minutes?: number;
  points?: number;
  weight?: number;
  adjustmentCents?: number;
};

export type TipResult = {
  workerId: string;
  name: string;
  role?: string;
  basis: number;
  shareCents: number;
  sharePercent: number;
};

export type CalculateTipSplitInput = {
  totalTipsCents: number;
  method: SplitMethod;
  workers: WorkerInput[];
};

export type CalculateTipSplitError =
  | 'NO_WORKERS'
  | 'INVALID_TOTAL'
  | 'ALL_ZERO_BASIS'
  | 'INVALID_WORKER_VALUE'
  | 'ADJUSTMENTS_EXCEED_POOL';

export type CalculateTipSplitSuccess = {
  ok: true;
  method: SplitMethod;
  results: TipResult[];
  totalTipsCents: number;
  totalDistributedCents: number;
};

export type CalculateTipSplitFailure = {
  ok: false;
  error: CalculateTipSplitError;
  message: string;
};

export type CalculateTipSplitResult = CalculateTipSplitSuccess | CalculateTipSplitFailure;

export const SPLIT_METHOD_LABELS: Record<SplitMethod, string> = {
  equal: 'Equal',
  hours: 'By Hours',
  points: 'By Points',
  weightedHours: 'Weighted Hours',
};

export const DEFAULT_ROLE_SUGGESTIONS = [
  'Server',
  'Bartender',
  'Busser',
  'Host',
  'Food Runner',
  'Other',
] as const;
