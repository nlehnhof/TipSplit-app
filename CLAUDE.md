# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TipSplit is a restaurant tip-splitting calculator (Expo/React Native/TypeScript, iOS + Android).
The full product spec is [`TipSplit_prompt.md`](./TipSplit_prompt.md) — read it before making
product decisions; it is the source of truth for scope, defaults, and what NOT to build (e.g. no
account required for the basic calculator, no legal restrictions baked into the calculation
engine). The phase-by-phase build plan is [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md).
[`docs/architecture.md`](./docs/architecture.md) has an up-to-date "what's built vs. not" list —
check it before assuming a feature (saved workers, auth, subscriptions, history) exists.

## Commands

```bash
npm install
npm start           # expo start — press i/a/w for iOS/Android/web, or scan the QR code
npm run ios         # expo start --ios
npm run android     # expo start --android
npm run web         # expo start --web

npm test            # jest (jest-expo preset)
npm run test:watch  # jest --watch
npx jest src/calculations/tipSplit.test.ts   # run a single test file
npx jest -t "adjustments"                    # run tests matching a name pattern

npm run lint        # eslint .
npm run format      # prettier --write .
npm run typecheck   # tsc --noEmit
```

No environment variables exist yet — there is no backend. Verify a change with `typecheck`,
`lint`, and `test` before considering it done; there's no CI configured yet to catch this later.

## Architecture

**The calculation engine is the core of this app and must stay UI-free.**
`src/calculations/tipSplit.ts` exports one pure function, `calculateTipSplit()`, with no React or
UI imports — see [`docs/calculation-methods.md`](./docs/calculation-methods.md) for the full
contract (methods, rounding, adjustments, error cases). Two invariants any change to this file
must preserve, both covered by `tipSplit.test.ts`:

1. **All money is integer cents.** Never do financial arithmetic in floating-point dollars.
   Dollar strings are parsed to cents at the UI boundary (`src/utils/parse.ts`) and only
   formatted back to a display string at render time (`src/calculations/money.ts`).
2. **`sum(results.map(r => r.shareCents)) === totalTipsCents`**, always, via the largest-remainder
   allocation in `allocateByBasis()`. If you touch that function, re-run the rounding-invariant
   test (it sweeps a matrix of pool sizes and worker counts) before trusting the change.

**Draft state vs. engine input are deliberately separate types.** `src/types/draft.ts`
(`DraftWorker`) holds free-form text for in-progress form fields; `src/types/tipSplit.ts`
(`WorkerInput`) is what the engine accepts (finite numbers only). Conversion happens once, at
calculate time (`toWorkerInput()` in `src/app/index.tsx`) — don't thread numeric parsing into the
input components themselves.

**Routing.** Expo Router auto-detects `src/app/` as the routes root because a top-level `src/`
directory exists (confirmed by the "Using src/app as the root directory for Expo Router" line
Metro prints on start/export) — routes do not need to be duplicated at the project root. The
calculator and its results view are the *same* route (`src/app/index.tsx`), toggled by local
component state (`view: 'input' | 'results'`) rather than a second route with params, so editing
a result and recalculating is instant with no serialization round-trip.

**Theming.** `src/constants/theme.tsx` (`ThemeProvider` / `useThemeColors()`) tracks
`useColorScheme()` for automatic light/dark support. Color tokens live in
`src/constants/themeColors.ts` (kept as a separate file from `theme.tsx` — a `.ts`/`.tsx` pair
with the same base name is ambiguous for Metro's resolver).

**Persistence.** The in-progress calculation is debounce-saved to `AsyncStorage`
(`src/storage/lastCalculation.ts`) and restored on launch. This is local-only; there is no cloud
sync (saved workers/teams/history/auth are unbuilt — see `docs/architecture.md`).

## Conventions

- Don't add half-finished feature scaffolding (e.g. a `SubscriptionService` stub with no real
  provider behind it) — build a vertical slice completely or leave it out of the tree, per
  `docs/architecture.md`'s "what's not built yet" list.
- The calculation engine must never throw on bad input or produce `NaN`/`Infinity` — it returns a
  typed `{ ok: false, error, message }` result instead (see the error union in
  `src/types/tipSplit.ts`).
- Legal/compliance restrictions on tip-pooling method or role composition belong in documentation
  and the Settings disclaimer (`src/app/settings.tsx`), never in the calculation engine itself —
  see `docs/tip-splitting-research.md` for why (tip-pooling law varies by U.S. state and by
  whether an employer takes a tip credit).
