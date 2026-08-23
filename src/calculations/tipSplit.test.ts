import { calculateTipSplit } from './tipSplit';
import type { WorkerInput } from '../types/tipSplit';

function worker(overrides: Partial<WorkerInput> & { workerId: string; name: string }): WorkerInput {
  return overrides;
}

function sumCents(results: { shareCents: number }[]): number {
  return results.reduce((sum, r) => sum + r.shareCents, 0);
}

describe('calculateTipSplit — equal split', () => {
  it('splits evenly across 4 workers', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'equal',
      workers: [
        worker({ workerId: '1', name: 'A' }),
        worker({ workerId: '2', name: 'B' }),
        worker({ workerId: '3', name: 'C' }),
        worker({ workerId: '4', name: 'D' }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([2500, 2500, 2500, 2500]);
    expect(result.totalDistributedCents).toBe(10000);
  });

  it('distributes the leftover cent deterministically when it does not divide evenly', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'equal',
      workers: [
        worker({ workerId: '1', name: 'A' }),
        worker({ workerId: '2', name: 'B' }),
        worker({ workerId: '3', name: 'C' }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sumCents(result.results)).toBe(10000);
    expect(result.results.map((r) => r.shareCents).sort((a, b) => b - a)).toEqual([3334, 3333, 3333]);
  });
});

describe('calculateTipSplit — hours', () => {
  it('splits proportionally by hours', () => {
    const result = calculateTipSplit({
      totalTipsCents: 100000,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'Sarah', hours: 8 }),
        worker({ workerId: '2', name: 'Mike', hours: 6 }),
        worker({ workerId: '3', name: 'John', hours: 6 }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([40000, 30000, 30000]);
  });

  it('matches the prompt worked example: $100 for 8h and 2h', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 8 }),
        worker({ workerId: '2', name: 'B', hours: 2 }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([8000, 2000]);
  });

  it('supports fractional hours via minutes', () => {
    const result = calculateTipSplit({
      totalTipsCents: 12400 * 10,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'Sarah', hours: 8, minutes: 0 }),
        worker({ workerId: '2', name: 'Mike', hours: 7, minutes: 0 }),
        worker({ workerId: '3', name: 'John', hours: 5, minutes: 30 }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sumCents(result.results)).toBe(124000);
  });
});

describe('calculateTipSplit — points', () => {
  it('splits proportionally by points', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'points',
      workers: [
        worker({ workerId: '1', name: 'A', points: 8 }),
        worker({ workerId: '2', name: 'B', points: 2 }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([8000, 2000]);
  });
});

describe('calculateTipSplit — weighted hours', () => {
  it('applies per-worker multipliers to hours before splitting', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'weightedHours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 8, weight: 1.0 }),
        worker({ workerId: '2', name: 'B', hours: 8, weight: 2.0 }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // effective hours: 8 and 16 -> 1/3 and 2/3 of $100
    expect(result.results.map((r) => r.shareCents)).toEqual([3333, 6667]);
    expect(sumCents(result.results)).toBe(10000);
  });

  it('defaults weight to 1.0 when omitted', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'weightedHours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 5 }),
        worker({ workerId: '2', name: 'B', hours: 5 }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([5000, 5000]);
  });
});

describe('calculateTipSplit — adjustments', () => {
  it('adds a flat adjustment on top of the proportional share', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 5, adjustmentCents: 500 }),
        worker({ workerId: '2', name: 'B', hours: 5 }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // remaining pool after the $5 adjustment is $95, split evenly by hours -> $47.50 each
    expect(result.results[0].shareCents).toBe(500 + 4750);
    expect(result.results[1].shareCents).toBe(4750);
    expect(sumCents(result.results)).toBe(10000);
  });

  it('rejects adjustments that exceed the total pool', () => {
    const result = calculateTipSplit({
      totalTipsCents: 1000,
      method: 'equal',
      workers: [worker({ workerId: '1', name: 'A', adjustmentCents: 2000 })],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('ADJUSTMENTS_EXCEED_POOL');
  });
});

describe('calculateTipSplit — rounding invariant', () => {
  it('always sums to the total tip pool across many amounts and worker counts', () => {
    const totals = [1, 7, 13, 99, 100, 101, 12345, 999999, 100000000];
    const workerCounts = [1, 2, 3, 5, 7, 11, 23];

    for (const totalTipsCents of totals) {
      for (const count of workerCounts) {
        const workers = Array.from({ length: count }, (_, i) =>
          worker({ workerId: String(i), name: `W${i}`, hours: (i % 5) + 1 }),
        );
        const result = calculateTipSplit({ totalTipsCents, method: 'hours', workers });
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        expect(sumCents(result.results)).toBe(totalTipsCents);
      }
    }
  });
});

describe('calculateTipSplit — edge cases', () => {
  it('rejects zero workers', () => {
    const result = calculateTipSplit({ totalTipsCents: 1000, method: 'equal', workers: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('NO_WORKERS');
  });

  it('handles a single worker taking the full pool', () => {
    const result = calculateTipSplit({
      totalTipsCents: 12345,
      method: 'hours',
      workers: [worker({ workerId: '1', name: 'A', hours: 3 })],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results[0].shareCents).toBe(12345);
  });

  it('handles 100+ workers', () => {
    const workers = Array.from({ length: 137 }, (_, i) =>
      worker({ workerId: String(i), name: `W${i}`, hours: 1 }),
    );
    const result = calculateTipSplit({ totalTipsCents: 999999, method: 'hours', workers });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sumCents(result.results)).toBe(999999);
  });

  it('falls back to an equal split when every worker has zero hours', () => {
    const result = calculateTipSplit({
      totalTipsCents: 9000,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 0 }),
        worker({ workerId: '2', name: 'B', hours: 0 }),
        worker({ workerId: '3', name: 'C', hours: 0 }),
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([3000, 3000, 3000]);
  });

  it('gives zero-hour workers nothing when mixed with nonzero-hour workers', () => {
    const result = calculateTipSplit({
      totalTipsCents: 10000,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 0 }),
        worker({ workerId: '2', name: 'B', hours: 10 }),
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([0, 10000]);
  });

  it('rejects a non-integer or negative total', () => {
    const negative = calculateTipSplit({
      totalTipsCents: -100,
      method: 'equal',
      workers: [worker({ workerId: '1', name: 'A' })],
    });
    expect(negative.ok).toBe(false);

    const fractional = calculateTipSplit({
      totalTipsCents: 100.5,
      method: 'equal',
      workers: [worker({ workerId: '1', name: 'A' })],
    });
    expect(fractional.ok).toBe(false);
  });

  it('rejects negative hours, points, or weight', () => {
    const negHours = calculateTipSplit({
      totalTipsCents: 1000,
      method: 'hours',
      workers: [worker({ workerId: '1', name: 'A', hours: -5 })],
    });
    expect(negHours.ok).toBe(false);

    const negPoints = calculateTipSplit({
      totalTipsCents: 1000,
      method: 'points',
      workers: [worker({ workerId: '1', name: 'A', points: -1 })],
    });
    expect(negPoints.ok).toBe(false);

    const negWeight = calculateTipSplit({
      totalTipsCents: 1000,
      method: 'weightedHours',
      workers: [worker({ workerId: '1', name: 'A', hours: 5, weight: -1 })],
    });
    expect(negWeight.ok).toBe(false);
  });

  it('rejects NaN and Infinity anywhere in worker inputs', () => {
    const nanResult = calculateTipSplit({
      totalTipsCents: 1000,
      method: 'hours',
      workers: [worker({ workerId: '1', name: 'A', hours: NaN })],
    });
    expect(nanResult.ok).toBe(false);

    const infResult = calculateTipSplit({
      totalTipsCents: 1000,
      method: 'hours',
      workers: [worker({ workerId: '1', name: 'A', hours: Infinity })],
    });
    expect(infResult.ok).toBe(false);
  });

  it('handles a zero tip pool', () => {
    const result = calculateTipSplit({
      totalTipsCents: 0,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 5 }),
        worker({ workerId: '2', name: 'B', hours: 5 }),
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.map((r) => r.shareCents)).toEqual([0, 0]);
  });

  it('handles a very large tip pool', () => {
    const result = calculateTipSplit({
      totalTipsCents: 100_000_000_00, // $100,000,000.00
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 1 }),
        worker({ workerId: '2', name: 'B', hours: 3 }),
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sumCents(result.results)).toBe(100_000_000_00);
  });

  it('handles a very small tip pool (a single cent)', () => {
    const result = calculateTipSplit({
      totalTipsCents: 1,
      method: 'hours',
      workers: [
        worker({ workerId: '1', name: 'A', hours: 1 }),
        worker({ workerId: '2', name: 'B', hours: 1 }),
        worker({ workerId: '3', name: 'C', hours: 1 }),
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(sumCents(result.results)).toBe(1);
  });
});
