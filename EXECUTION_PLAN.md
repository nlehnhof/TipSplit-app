# TipSplit — Execution Plan (Claude Code + Claude-in-Chrome)

This plan translates `TipSplit_prompt.md` into an actionable build sequence split across two tools: **Claude Code**, running locally in this repo, does all coding, testing, and file work. **Claude-in-Chrome** handles anything that requires browsing live web pages — research with citable sources, and later, App Store Connect / Google Play Console / RevenueCat dashboard setup.

Repo root: this folder (`TipSplit/`), now a git repo (see "Repo setup" below).

---

## Division of labor

| Tool | Responsible for |
|---|---|
| **Claude Code** (CLI, local, in this repo) | Expo/RN/TS project scaffolding, calculation engine, UI, tests, lint/typecheck, local storage, auth wiring, subscription abstraction code, docs written from research notes, git commits |
| **Claude-in-Chrome** (browser automation) | Phase 1 research with live sources (DOL/state labor sites, IRS, Apple/Google policy pages, Expo/RN release notes, RevenueCat docs); later, walking through App Store Connect and Google Play Console setup screens and RevenueCat dashboard configuration |

Rule of thumb: if it needs a URL opened and read, it's Claude-in-Chrome. If it needs a file written, a command run, or a test executed, it's Claude Code.

---

## Repo setup (done this session)

- `git init` run in this folder, with the existing `TipSplit_prompt.md` as the first commit.
- `.gitignore` added for Node/Expo/TypeScript (node_modules, .expo, dist/build output, .env, native build dirs).
- This plan committed alongside it.

Next, from Claude Code (locally, in this same folder): run `npx create-expo-app@latest . --template` (or equivalent) to scaffold, being careful not to overwrite the existing files — commit early and often, one logical change per commit, per your standing git preferences.

---

## Phase 1 — Research (Claude-in-Chrome)

Deliverable: `docs/tip-splitting-research.md`, with sources and URLs.

Open a tab and gather findings on each, capturing the source URL for every claim:

1. Equal tip splitting — general practice overviews.
2. Hours-based tip splitting — common formulas.
3. Weighted-hours / shift-differential splitting.
4. Point-based tip systems (role-weighted points, e.g. server=1, busser=0.5).
5. Percentage-based systems.
6. Tip pools vs. tip sharing/tip-outs — the legal distinction (pooling among tipped employees vs. mandated tip-outs to support staff).
7. Role differences: servers, bartenders, bussers, hosts, food runners — who's typically included/excluded from pools.
8. U.S. federal baseline: DOL Wage and Hour Division guidance on tip pooling (FLSA tip credit rules, the 2020/2021/2023-era tip regulations, and who counts as an "employer" for tip-pool purposes — verify the current in-force rule, since this area has had multiple rulemakings).
9. State-level variation: at minimum flag that states like California prohibit tip credits and have their own pooling rules, and that municipal ordinances can add further restrictions — this doesn't need to be exhaustive, just enough to justify the app's stance.
10. Current Apple App Store and Google Play requirements for subscription apps (auto-renewable subscriptions, StoreKit 2 / Play Billing Library current version, required disclosures, restore-purchases requirement).
11. RevenueCat's current SDK and pricing/free-tier terms if it's the recommended abstraction.
12. Current Expo SDK version and Expo Router version, and any relevant React Native New Architecture requirements for 2026 App Store submissions.

Suggested authoritative starting points (verify current URLs, don't assume these haven't moved):
- dol.gov (Wage and Hour Division, Fact Sheet on tip pooling)
- irs.gov (tip income/reporting)
- developer.apple.com (App Store Review Guidelines §3.1, StoreKit docs)
- support.google.com/googleplay/android-developer (subscriptions policy)
- docs.expo.dev (SDK version, Expo Router, EAS Build/Submit)
- revenuecat.com/docs

Output format: one section per topic above, each with a plain-language summary and a "Sources" sub-list of links. End with a short "Product implications" section translating findings into the disclaimer language and the decision to keep the calculation engine unrestricted/configurable (already specified in the prompt — just confirm nothing found contradicts that approach).

---

## Phase 2 — Architecture (Claude Code)

Deliverable: `docs/architecture.md`.

- Finalize folder structure (prompt's suggested `src/` layout is a reasonable starting point).
- Data model: `Worker`, `WorkerInput`, `SplitMethod`, `TipSplit`, `TipResult` types.
- Calculation engine contract: pure function `calculateTipSplit()`, no React/UI imports, integer-cents internally.
- Storage plan: local-first (AsyncStorage or MMKV/SQLite via Expo) for offline calculator + saved workers/teams cache; Supabase (Auth + Postgres) for account/cloud sync, evaluated against alternatives (e.g. Expo's own backend options) with a one-paragraph justification either way.
- Subscription abstraction: `SubscriptionService` interface (`isPremium()`, `purchasePremium()`, `restorePurchases()`), backed by RevenueCat initially, swappable later.
- Navigation: Expo Router file-based routes for calculator (default/no-auth route), results, workers, teams, history, settings, paywall.

## Phase 3 — Calculation engine (Claude Code)

Build `src/calculations/tipSplit.ts` and tests before any UI exists.

- Integer-cents math throughout; no float dollar arithmetic.
- Deterministic remainder allocation (e.g. largest-remainder method, documented in code comments and in `docs/calculation-methods.md`) so displayed amounts always sum exactly to the pool.
- Implement all four methods: Equal, Hours, Points, Weighted Hours.
- Guard rails: reject/handle zero workers, zero pool, all-zero-hours, negative inputs, NaN/Infinity — return typed error results, never throw uncaught or render broken numbers.
- Unit tests per the prompt's Section 25 (equal, hours, points, weighted hours, rounding-sum invariant, edge cases: 1 worker, 100+ workers, 0 hours, mixed zero/nonzero, fractional hours, very large/small amounts). Use Jest (or Vitest if that's already the Expo/RN convention Claude Code finds in a fresh scaffold — check what `create-expo-app` wires up by default rather than assuming).

Exit criteria: `sum(results) === totalTipsCents` holds in every test case; typecheck and lint clean.

## Phase 4 — Calculator UI (Claude Code)

- Single-screen calculator: tip pool input → method selector (segmented control, 4 options) → worker list with inline hour/point/weight entry → Calculate button.
- No account gate anywhere in this flow.
- Method-specific inputs only (hide points/weight fields unless relevant).
- Large touch targets, large numbers, minimal typing, sensible numeric keyboard behavior.

## Phase 5 — Results screen + editing (Claude Code)

- Results screen per the prompt's Section 11 example: per-worker name/role/hours, dollar amount, percentage, subtle bar visualization (Section 12), method label, total-distributed confirmation line.
- Edit path back into the calculator with all values preserved, recalculating live on any change (hours, method, tips, add/remove worker).

## Phase 6 — Local persistence (Claude Code)

- Persist the in-progress/last calculation locally so app relaunch doesn't lose state.
- Local-only "saved workers" cache scaffolding (even before premium gating) so Phase 7 just adds the paywall, not new plumbing.

## Phase 7 — Premium: saved workers, teams, history, auth (Claude Code)

- `SubscriptionService.isPremium()` gates: saved workers, saved teams, history, cloud sync.
- Supabase Auth (or documented alternative) wired behind an "Account" settings entry point, never required to reach the calculator.
- History item schema per Section 16; add a retention/delete-my-data control.

## Phase 8 — Subscriptions (Claude Code + Claude-in-Chrome for dashboard setup)

- Claude Code: integrate RevenueCat SDK behind `SubscriptionService`, wire entitlement checks, restore-purchases button in Settings, paywall screen.
- Claude-in-Chrome (when ready to configure, not before code is ready): walk through RevenueCat dashboard product/entitlement setup, App Store Connect subscription group creation, Google Play Console subscription setup — screenshot the required steps into `docs/subscriptions.md` as a checklist, since actual store credentials are Nate's to enter, not something to automate blindly.

## Phase 9 — Polish (Claude Code)

- Error/empty/loading states, dark mode, accessibility labels/contrast/dynamic type, animations where they earn their keep, keyboard handling, responsive layouts.

## Phase 10 — Testing, typecheck, lint (Claude Code)

- Full test suite, `tsc --noEmit`, ESLint, Prettier check — fix everything before calling a phase done.
- Manual verification checklist: calculation engine, navigation, persistence, premium boundaries (free features stay usable, premium features gated correctly), production build config sanity.

## Phase 11 — App Store readiness (Claude Code for config, Claude-in-Chrome to verify current requirements)

- App icon/splash placeholders, bundle identifiers, `app.json`/`app.config.ts`, EAS build profiles, `.env.example` with explanations, privacy policy/terms placeholders.
- Claude-in-Chrome double-checks current EAS Submit / App Store Connect / Play Console requirements haven't changed since Phase 1 research before this is finalized.

---

## Documentation set (Claude Code writes these; Phase 1 research feeds the first one)

- `README.md`
- `docs/tip-splitting-research.md`
- `docs/architecture.md`
- `docs/subscriptions.md`
- `docs/app-store-deployment.md`
- `docs/calculation-methods.md`

---

## Decisions still open for Nate

- Confirm Supabase as the account/sync backend, or flag a preference now before Phase 2 locks it in.
- Confirm RevenueCat as the subscription abstraction (vs. native StoreKit/Play Billing directly).
- Any existing Apple/Google developer account details, bundle ID convention, or brand assets (icon, color palette) to seed now rather than placeholder.

## How to run this plan

This plan document lives in the repo so a local Claude Code session (run from a terminal in this folder) can pick it up phase by phase. Suggested invocation pattern per phase: point Claude Code at this file and the relevant phase number, let it implement + test + commit, then move to the next phase. Claude-in-Chrome phases (1 and parts of 8/11) can run independently whenever fresh research or dashboard walkthroughs are needed.
