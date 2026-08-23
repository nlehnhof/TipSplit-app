# Tip-Splitting Research

Research to ground TipSplit's calculation methods, disclaimer language, and the decision to keep
the calculation engine unrestricted/configurable rather than baking in legal assumptions.

## 1–7. Common distribution methods and terminology

- **Equal split** — the pool is divided evenly regardless of hours or role. Simplest, most common
  for small, same-shift teams.
- **Hours-based split** — each worker's share is proportional to hours worked
  (`hours / total hours`). The most commonly recommended default for teams with varying shift
  lengths, and TipSplit's default method per the product spec.
- **Weighted hours** — hours multiplied by a per-worker or per-role multiplier before splitting,
  used when roles contribute unequally to service (e.g. a bartender or shift lead weighted higher
  than a busser).
- **Point-based systems** — each role (sometimes each worker) is assigned a fixed point value
  (e.g. server = 1.0, bartender = 1.0, busser = 0.5, host = 0.5); the pool is split proportional to
  total points earned. Common in restaurants that want a stable, pre-agreed ratio between roles
  regardless of exact hours.
- **Percentage-based systems** — a fixed percentage of tips is routed to specific roles or a
  support pool before the remainder is split among front-of-house staff (functionally a hybrid of
  a mandated tip-out plus one of the methods above).
- **Tip pools vs. tip-outs** — a *tip pool* combines everyone's tips before dividing them by an
  agreed method; a *tip-out* is a smaller mandated transfer from tipped workers (e.g. servers) to
  support staff (bussers, food runners, bartenders) who don't directly collect tips. Legally, who
  can be required to participate in either differs by jurisdiction and by whether the employer
  claims a tip credit.
- **Role differences** — servers and bartenders are near-universally eligible for tip pools.
  Bussers, hosts, and food runners are included in many pools but not all, and eligibility often
  depends on whether they're in the customer "chain of service." Back-of-house roles (cooks,
  dishwashers) are excluded from tip credit pools under federal law, and under many state laws
  (e.g. California) can only be included if the employer pays full minimum wage and forgoes any
  tip credit — see below.

## 8. U.S. federal baseline (FLSA)

- Federal minimum wage is $7.25/hr; with a valid tip credit, the minimum direct cash wage is
  $2.13/hr (max federal tip credit $5.12/hr).
- Tips are the property of the employee. The 2018 FLSA amendment, reinforced by DOL rules
  finalized in 2021, permanently bars employers, managers, and supervisors from keeping any
  portion of employee tips — including from a tip pool — regardless of whether a tip credit is
  taken.
- Only employees who *regularly and customarily* receive tips can be required into a mandatory
  tip pool **if the employer takes a tip credit**. If the employer pays the full minimum wage
  (no tip credit), back-of-house employees (cooks, dishwashers) may be included in a "nontraditional"
  tip pool.
- Employers must keep records of tips received per employee, pool contributions/distributions, and
  hours worked in tipped vs. non-tipped duties.

Sources: [DOL Fact Sheet #15A — Ownership of Tips](https://www.dol.gov/agencies/whd/fact-sheets/15a-flsa-tip-ownership), [DOL Fact Sheet #15B — Managers and Supervisors](https://www.dol.gov/agencies/whd/fact-sheets/15b-managers-supervisors-tips-flsa)

## 9. State-level variation

Tip-pooling rules are not federally uniform, and this is the core reason TipSplit does not hard-code
legal restrictions into the calculator:

- **California** takes no tip credit at all — tipped employees must be paid full state minimum wage
  ($16.90/hr as of 2026) regardless of tips earned. Only workers in the customer "chain of service"
  (servers, bartenders, bussers, runners) may be pooled; managers, owners, and back-of-house staff
  not directly serving customers are excluded even under a no-tip-credit model.
- Other states (and some municipalities) layer additional restrictions on top of the federal
  floor — who may be pooled, notice/transparency requirements, and payout timing.

This is not exhaustive; it's enough to establish that **no single distribution method is
universally compliant**, which is why TipSplit lets the user pick the method and role composition
rather than enforcing one.

Sources: [California Tipping Laws 2026 — Tiphaus](https://www.tiphaus.com/blog/california-tipping-laws-explained-service-charges-minimum-wage-and-your-rights/), [Nolo — California Laws for Tipped Employees](https://www.nolo.com/legal-encyclopedia/california-laws-tipped-employees.html)

## 10. Apple App Store subscription requirements

- Auto-renewable subscriptions must go through StoreKit — Apple's In-App Purchase system — per
  App Review Guideline 3.1.
- A visible **restore purchases** control is required (Guideline 3.1.1) for any restorable
  purchase, including subscriptions. Apple checks for it specifically; it should live somewhere
  discoverable (Settings, paywall), not buried.
- With StoreKit 2, `Transaction.currentEntitlements` is the modern way to check what a user is
  currently entitled to (e.g. after reinstall or device switch) and should be used to restore
  access immediately.

Sources: [Apple — In-App Purchase](https://developer.apple.com/in-app-purchase/), [Apple — Auto-renewable Subscriptions](https://developer.apple.com/app-store/subscriptions/)

## 11. Google Play subscription requirements

- Google Play requires Play Billing Library **v8+** for all new apps and updates by
  **August 31, 2026** (extension available to November 1, 2026) — relevant to check again before
  Phase 8 (subscriptions) implementation, since this project starts after that cutover date.
- Subscriptions must provide ongoing, recurring value — they may not be used to gate what is
  effectively a one-time benefit.

Source: [Play Console Help — Understanding Google Play's Payments policy](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en)

## 12. Current Expo / React Native versions (as scaffolded)

This project was scaffolded on 2026-08-23 with **Expo SDK 57**, **React Native 0.86.2**, **React
19.2.3**, and **Expo Router 57**, via `create-expo-app`'s `blank-typescript` template plus
`npx expo install`, so dependency versions are whatever the Expo CLI resolved as
SDK-57-compatible at that time.

## Product implications

Nothing found above contradicts the product spec's existing stance:

- The calculation engine (`src/calculations/tipSplit.ts`) imposes **no legal restrictions** on
  which method, roles, or pool composition a user chooses — that decision is the organization's,
  not the app's, given how much this varies by state and by whether a tip credit is taken.
- The Settings-screen disclaimer explicitly states TipSplit is a calculation tool, not legal/tax/
  payroll advice, and that pooling rules vary by jurisdiction — see `src/app/settings.tsx`.
- When saved teams/roles ship (a premium feature, not yet built), role suggestions should stay
  informational only (e.g. "Server", "Bartender", "Busser", "Host", "Food Runner") — the app
  should never silently exclude a role from a pool on the user's behalf.
