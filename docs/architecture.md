# Architecture

## Stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript (strict)
- Expo Router (file-based routing, `src/app/`)
- Local-first: the calculator works fully offline

## Folder structure

```text
src/
  app/            expo-router screens (index = calculator/results, settings)
  components/     presentational, reusable UI (Button, MethodSelector, WorkerRow)
  calculations/   pure calculation engine — no React or UI imports
  types/          shared TypeScript types
  constants/      theme (light/dark), spacing/radius tokens
  storage/        AsyncStorage-backed local persistence
  utils/          small stateless helpers (id generation, text parsing)
```

This is a trimmed version of the structure sketched in `TipSplit_prompt.md`. `features/`,
`services/` (auth/subscriptions) don't exist yet because saved workers, teams, history,
authentication, and subscriptions are not implemented — see "What's not built yet" below.

## Calculation engine boundary

`src/calculations/tipSplit.ts` is intentionally isolated: it takes plain data in, returns plain
data out, and is unit-tested independently of any UI (`docs/calculation-methods.md` has the full
contract). The calculator screen (`src/app/index.tsx`) owns all UI state — text-field drafts, the
selected method, the current view (`input` vs `results`) — and only calls into the engine at the
moment the user taps "Calculate Tips".

Draft worker state (`src/types/draft.ts`) is deliberately separate from the engine's `WorkerInput`
type: form fields need to hold arbitrary in-progress text (`"7."`, empty string, etc.), while the
engine only accepts finite numbers. Conversion happens once, at calculate time
(`toWorkerInput` in `src/app/index.tsx`).

## Navigation

Two routes today:

- `/` — the calculator. Internally toggles between an `input` view and a `results` view using
  local component state rather than a second route, so editing a result and recalculating is
  instant and doesn't require passing a calculation through route params.
- `/settings` — currency (USD only for now), subscription status placeholder, and the tip-pooling
  disclaimer required by the product spec.

## Persistence

The in-progress calculation (total, method, workers) is persisted to `AsyncStorage`
(`src/storage/lastCalculation.ts`) on a short debounce and restored on next launch, so relaunching
the app mid-shift doesn't lose data. This is local-only; there is no cloud sync yet.

## Theming

`src/constants/theme.tsx` provides a `ThemeProvider`/`useThemeColors()` pair driven by
`useColorScheme()`, so every screen picks up light/dark automatically. Color tokens live in
`src/constants/themeColors.ts`.

## What's not built yet

Per the product spec (`TipSplit_prompt.md`), the following are explicitly out of scope for this
pass and are not stubbed in the codebase (per the project's "no half-finished features" convention
— they'll be built as complete vertical slices, not partial scaffolding):

- Saved workers / saved teams (the primary premium feature)
- Calculation history
- Authentication (Supabase or otherwise) and cloud sync
- `SubscriptionService` abstraction and RevenueCat/StoreKit/Play Billing integration
- Onboarding screen (first-launch "Get Started" flow)
- App icons / splash screen assets, EAS build profiles, store metadata

`EXECUTION_PLAN.md` has the phase-by-phase plan; the calculator, results/edit flow, local
persistence, and settings/disclaimer correspond to Phases 2–6.
