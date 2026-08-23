import { isFiniteNumber } from './money';
import type {
  CalculateTipSplitInput,
  CalculateTipSplitResult,
  SplitMethod,
  TipResult,
  WorkerInput,
} from '../types/tipSplit';

function failWith(
  error: Extract<CalculateTipSplitResult, { ok: false }>['error'],
  message: string,
): CalculateTipSplitResult {
  return { ok: false, error, message };
}

/**
 * Basis value each worker contributes toward the pool, per method.
 * 'equal' ignores worker-specific data entirely -- every worker's basis is 1.
 */
function computeBasis(method: SplitMethod, worker: WorkerInput): number {
  switch (method) {
    case 'equal':
      return 1;
    case 'hours':
      return (worker.hours ?? 0) + (worker.minutes ?? 0) / 60;
    case 'points':
      return worker.points ?? 0;
    case 'weightedHours': {
      const hours = (worker.hours ?? 0) + (worker.minutes ?? 0) / 60;
      const weight = worker.weight ?? 1;
      return hours * weight;
    }
  }
}

function validateWorker(method: SplitMethod, worker: WorkerInput): string | null {
  const fields: [string, number | undefined][] = [
    ['hours', worker.hours],
    ['minutes', worker.minutes],
    ['points', worker.points],
    ['weight', worker.weight],
    ['adjustmentCents', worker.adjustmentCents],
  ];

  for (const [field, value] of fields) {
    if (value === undefined) continue;
    if (!isFiniteNumber(value)) {
      return `${worker.name || worker.workerId}: ${field} must be a finite number.`;
    }
    if (field !== 'adjustmentCents' && value < 0) {
      return `${worker.name || worker.workerId}: ${field} cannot be negative.`;
    }
  }

  return null;
}

/**
 * Splits remainingCents across the given basis values using the largest-remainder
 * method, so the returned cent amounts always sum to exactly remainingCents.
 * Ties in the fractional remainder are broken by original array order, which keeps
 * the allocation deterministic and reproducible for the same input.
 */
function allocateByBasis(remainingCents: number, basisValues: number[]): number[] {
  const totalBasis = basisValues.reduce((sum, value) => sum + value, 0);
  const count = basisValues.length;

  if (totalBasis <= 0) {
    // No usable basis (e.g. all zero hours): fall back to an equal split of the
    // remaining pool so the function still returns a valid, fully-distributed result.
    return allocateByBasis(remainingCents, basisValues.map(() => 1));
  }

  const exactShares = basisValues.map((value) => (value / totalBasis) * remainingCents);
  const floorShares = exactShares.map((value) => Math.floor(value));
  const remainders = exactShares.map((value, index) => ({
    index,
    fraction: value - floorShares[index],
  }));

  let distributedCents = floorShares.reduce((sum, value) => sum + value, 0);
  let leftover = remainingCents - distributedCents;

  remainders.sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  const finalCents = [...floorShares];
  for (let i = 0; i < leftover; i++) {
    const target = remainders[i % count].index;
    finalCents[target] += 1;
  }

  return finalCents;
}

export function calculateTipSplit(input: CalculateTipSplitInput): CalculateTipSplitResult {
  const { totalTipsCents, method, workers } = input;

  if (!isFiniteNumber(totalTipsCents) || totalTipsCents < 0 || !Number.isInteger(totalTipsCents)) {
    return failWith('INVALID_TOTAL', 'Total tips must be a non-negative whole number of cents.');
  }

  if (!workers || workers.length === 0) {
    return failWith('NO_WORKERS', 'Add at least one worker to calculate a split.');
  }

  for (const worker of workers) {
    const error = validateWorker(method, worker);
    if (error) {
      return failWith('INVALID_WORKER_VALUE', error);
    }
  }

  const adjustments = workers.map((w) => w.adjustmentCents ?? 0);
  const totalAdjustments = adjustments.reduce((sum, value) => sum + value, 0);
  const remainingCents = totalTipsCents - totalAdjustments;

  if (remainingCents < 0) {
    return failWith(
      'ADJUSTMENTS_EXCEED_POOL',
      'Worker adjustments add up to more than the total tip pool.',
    );
  }

  const basisValues = workers.map((worker) => computeBasis(method, worker));
  const proportionalCents = allocateByBasis(remainingCents, basisValues);

  const results: TipResult[] = workers.map((worker, index) => {
    const shareCents = proportionalCents[index] + adjustments[index];
    return {
      workerId: worker.workerId,
      name: worker.name,
      role: worker.role,
      basis: basisValues[index],
      shareCents,
      sharePercent: totalTipsCents > 0 ? (shareCents / totalTipsCents) * 100 : 0,
    };
  });

  const totalDistributedCents = results.reduce((sum, r) => sum + r.shareCents, 0);

  return {
    ok: true,
    method,
    results,
    totalTipsCents,
    totalDistributedCents,
  };
}
