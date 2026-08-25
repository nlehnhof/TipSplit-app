# Architecture

## Stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript (strict)
- Expo Router (file-based routing, `src/app/`)
- Local-first: the calculator works fully offline

## Folder structure

```text
src/
  app/            expo-router screens (calculator/results, settings, onboarding, paywall,
                   workers/, teams/, history/)
  components/     presentational, reusable UI (Button, MethodSelector, WorkerRow, PremiumGate)
  calculations/   pure calculation engine — no React or UI imports
  services/       subscription/ — SubscriptionService abstraction + local-dev and RevenueCat
                   implementations (see docs/subscriptions.md)
  types/          shared TypeScript types
  constants/      theme (light/dark), spacing/radius tokens
  storage/        AsyncStorage-backed local persistence (last calculation, onboarding flag,
                   saved workers, teams, history)
  utils/          small stateless helpers (id generation, text parsing)
```

This is a trimmed version of the structure sketched in `TipSplit_prompt.md`. There's no
`features/` split (calculator/workers/teams/history live directly under `app/` + shared
`storage/`/`types/`) since the app isn't large enough yet to need per-feature folders — see
"What's not built yet" below for what's still missing.

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

- `/` — the calculator. Internally toggles between an `input` view and a `results` view using
  local component state rather than a second route, so editing a result and recalculating is
  instant and doesn't require passing a calculation through route params. Also handles first-
  launch redirect to `/onboarding` and processes `loadWorkerIds`/`loadTeamId` route params (set
  by the pickers below) to append saved workers/teams into the current draft.
- `/onboarding` — first-launch-only welcome screen; sets a persisted flag and never shows again.
- `/settings` — currency (USD only for now), live Pro status + Restore Purchases, links into the
  screens below, and the tip-pooling disclaimer required by the product spec.
- `/paywall` — modal upsell screen; calls `SubscriptionService.purchasePremium()`.
- `/workers` (list/CRUD) and `/workers/select` (picker, modal) — Saved Workers.
- `/teams` (list), `/teams/[id]` (create when `id` is the literal `"new"`, else edit), and
  `/teams/select` (picker, modal) — Saved Teams.
- `/history` — read-only list of past calculations.

All of the above except `/`, `/onboarding`, `/settings`, and `/paywall` are wrapped in
`<PremiumGate>` (`src/components/PremiumGate.tsx`), which renders an upsell CTA instead of the
screen's content when `useSubscription().isPremium` is false.

## Persistence

- The in-progress calculation (total, method, workers) is persisted to `AsyncStorage`
  (`src/storage/lastCalculation.ts`) on a short debounce and restored on next launch, so
  relaunching the app mid-shift doesn't lose data.
- Saved workers, teams, and history are each their own `AsyncStorage` key
  (`src/storage/savedWorkers.ts`, `teams.ts`, `history.ts`), with simple CRUD helpers. History is
  capped at 100 entries.

All of this is local-only; there is no cloud sync yet (see "What's not built yet").

## Subscriptions

`SubscriptionService` (`src/services/subscription/types.ts`) is the interface every premium-gated
screen depends on via `useSubscription()` (`SubscriptionContext.tsx`) — never on a payment
provider directly. Two implementations exist; `SubscriptionContext` picks one at startup based on
whether a RevenueCat API key is configured:

- `localDevSubscriptionService` — an on-device AsyncStorage flag, toggleable from Settings. Used
  whenever no RevenueCat key is set (this is the default for local Expo Go development).
- `revenueCatSubscriptionService` — wraps `react-native-purchases` (a native module — requires a
  dev client, not Expo Go). Used once `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`/`_IOS` are set.

Full detail, including current RevenueCat dashboard state, in `docs/subscriptions.md`.

## Theming

`src/constants/theme.tsx` provides a `ThemeProvider`/`useThemeColors()` pair driven by
`useColorScheme()`, so every screen picks up light/dark automatically. Color tokens live in
`src/constants/themeColors.ts`.

## Building and deploying

`npx expo run:android` (a local native build) is currently broken on Windows by an upstream Expo/
`react-native-worklets` bug — use `eas build --platform android --profile production` instead,
which builds on EAS's Linux servers and is unaffected. See "Resolved" note in
`docs/subscriptions.md` for the full story. A build from this path has already been produced and
uploaded to Play Console's Internal testing track.

## What's not built yet

Per the project's "no half-finished features" convention, the following are not stubbed in the
codebase — they'll be built as complete vertical slices when unblocked, not partial scaffolding:

- Authentication (Supabase or otherwise) and cloud sync for saved workers/teams
- App Store/iOS-side: StoreKit subscription and RevenueCat Apple app are both fully wired (see
  `docs/subscriptions.md`) but nothing has shipped yet — no iOS EAS build, no TestFlight build,
  no App Review submission
- Store listing content (privacy policy, screenshots, description) — required before promoting
  past Play Console's Internal testing track

`EXECUTION_PLAN.md` has the original phase-by-phase plan.
