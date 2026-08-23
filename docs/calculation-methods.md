# Calculation Methods

The engine lives in `src/calculations/tipSplit.ts` and exposes one pure function:

```ts
calculateTipSplit({ totalTipsCents, method, workers }): CalculateTipSplitResult
```

It has no React or UI imports and can be tested in isolation (see `tipSplit.test.ts`).

## Money representation

All money is represented as **integer cents** (`totalTipsCents`, `shareCents`, `adjustmentCents`).
Dollar-denominated user input is converted to cents at the UI boundary
(`src/utils/parse.ts#parseDollarsToCents`) and only converted back to a display string at render
time (`src/calculations/money.ts#formatCurrency`). No financial arithmetic uses floating-point
dollars.

## Methods

| Method | Basis per worker | Formula |
|---|---|---|
| `equal` | `1` for every worker | `share = pool / workerCount` |
| `hours` | `hours + minutes/60` | `share = pool × (workerBasis / totalBasis)` |
| `points` | `points` | `share = pool × (workerBasis / totalBasis)` |
| `weightedHours` | `(hours + minutes/60) × weight` (weight defaults to `1.0`) | `share = pool × (workerBasis / totalBasis)` |

If every worker's basis is `0` for a proportional method (e.g. all workers logged `0` hours),
the engine falls back to an equal split of the pool rather than dividing by zero.

## Adjustments (Advanced)

Each worker may carry an optional `adjustmentCents` (positive or negative), surfaced in the UI
behind an "Adjustments" toggle. Adjustments are settled **before** the proportional split:

```
remainingPool = totalTipsCents − sum(adjustments)
proportionalShare = allocate(remainingPool, basis)
finalShare = proportionalShare + adjustment
```

If adjustments alone exceed the total pool, the engine returns the
`ADJUSTMENTS_EXCEED_POOL` error rather than producing negative-pool math.

## Rounding: largest-remainder allocation

Proportional shares are computed as exact rational shares of the pool, then rounded down to
whole cents. Whatever is left over (`remainingPool − sum(flooredShares)`, always fewer cents than
there are workers) is handed out one cent at a time to the workers with the largest fractional
remainder, breaking ties by original list order. This is the standard "largest remainder" /
Hamilton apportionment method, and it guarantees:

```
sum(results.map(r => r.shareCents)) === totalTipsCents
```

for every valid input — verified in `tipSplit.test.ts` across a matrix of pool sizes (from 1 cent
to $1,000,000) and worker counts (1 to 137).

## Validation and errors

`calculateTipSplit` never throws and never returns `NaN`/`Infinity`. It returns a discriminated
result:

- `{ ok: true, results, totalTipsCents, totalDistributedCents, method }`
- `{ ok: false, error, message }` with `error` one of:
  - `NO_WORKERS` — empty worker list
  - `INVALID_TOTAL` — total is negative, non-finite, or not a whole number of cents
  - `INVALID_WORKER_VALUE` — a worker's hours/minutes/points/weight is negative or non-finite
  - `ADJUSTMENTS_EXCEED_POOL` — adjustments alone exceed the tip pool

## Legal scope

The engine imposes no legal restrictions on which method a user may choose — tip-pooling rules
vary by U.S. state and by employee classification, and TipSplit is a calculator, not a compliance
tool. The disclaimer to that effect lives in Settings (`src/app/settings.tsx`).
