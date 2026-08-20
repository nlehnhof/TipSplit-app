# Build TipSplit — Restaurant Tip-Splitting Mobile App

You are an expert senior mobile application engineer, product designer, UX designer, and software architect.

Build a production-quality mobile application called **TipSplit**.

The goal is to create a simple, polished app that restaurant managers, servers, bartenders, and other tipped workers can use to quickly calculate how a pool of tips should be divided among workers based on the amount of time they worked and/or a configurable weighting system.

The application must ultimately be deployable to:

- Apple App Store
- Google Play Store

The application should feel like a real commercial product, not a prototype.

---

# 1. FIRST: RESEARCH THE PROBLEM

Before implementing the final calculation logic, research how restaurants and other tipped organizations commonly distribute pooled tips.

Research at minimum:

1. Equal tip splitting
2. Tip splitting based on hours worked
3. Weighted hours
4. Point-based tip systems
5. Percentage-based systems
6. Tip pools
7. Tip sharing/tip outs
8. Common differences between servers, bartenders, bussers, hosts, food runners, etc.
9. Common approaches used by restaurants in the United States
10. Current legal/regulatory considerations around tip pooling

Use authoritative/current sources where possible.

Important:

- Do NOT assume that one tip distribution method is universally legal.
- Tip-pooling laws can vary by jurisdiction and employee classification.
- The app should provide a disclaimer that TipSplit is a calculation tool and does not provide legal, tax, or employment advice.
- Do not build legal restrictions into the calculation engine unless they are explicitly configurable.
- The user should be able to choose how their organization distributes tips.

Use your research to inform the UX and available calculation methods.

Document your findings in:

`docs/tip-splitting-research.md`

Include sources and URLs.

---

# 2. TECHNOLOGY STACK

Use:

- React Native
- Expo
- TypeScript
- Expo Router
- Modern React patterns
- Strict TypeScript
- ESLint
- Prettier

The application must support:

- iOS
- Android

Prefer a single shared codebase.

Use a clean architecture so the calculation engine is completely independent from the UI.

Recommended structure:

```text
src/
  app/
  components/
  screens/
  features/
    calculator/
    workers/
    history/
    subscription/
    settings/
  services/
  storage/
  calculations/
  types/
  utils/
  constants/
```

The exact structure may differ if you have a better architecture, but keep business logic separate from presentation.

---

# 3. CORE PRODUCT PRINCIPLE

The primary purpose of TipSplit is:

> "Enter the tips, enter who worked and how long they worked, and immediately see what everyone gets."

The primary workflow should take less than 30 seconds.

Do NOT make users create an account before they can calculate tips.

The basic calculator should work completely offline.

---

# 4. CORE CALCULATOR

Create a calculator screen.

The user should enter:

### Tip Pool

- Total tips

Example:

`$1,240.00`

Optionally support:

- Cash tips
- Credit card tips
- Other tips

But keep the basic workflow simple.

---

# 5. WORKERS

The user can add workers.

Each worker should have:

- Name
- Role
- Hours worked
- Optional minutes
- Optional point/weight
- Optional individual adjustment

Example:

```text
Sarah
Server
7.5 hours

Mike
Server
6 hours

John
Bartender
8 hours
```

The role should be optional in the basic version.

Provide common role suggestions such as:

- Server
- Bartender
- Busser
- Host
- Food Runner
- Other

Allow custom roles.

---

# 6. DEFAULT CALCULATION METHOD

The default method should be:

## Hours-Based Split

Each worker receives a percentage of the tip pool proportional to their hours worked.

Formula:

```text
worker share =
worker hours / total worker hours
```

Then:

```text
worker tips =
total tips × worker share
```

Example:

```text
Total tips: $1,000

Sarah: 8 hours
Mike: 6 hours
John: 6 hours

Total hours = 20

Sarah = 8 / 20 = 40% = $400
Mike = 6 / 20 = 30% = $300
John = 6 / 20 = 30% = $300
```

This should be the default and most prominent calculation method.

---

# 7. CALCULATION METHODS

Provide a very easy way to switch between calculation methods.

At minimum support:

## Method 1 — Equal Split

Every worker receives the same amount.

Example:

```text
$1,000 / 4 workers = $250 each
```

## Method 2 — Hours Worked

Workers receive tips proportional to hours worked.

This should be the default.

## Method 3 — Points

Allow each worker to have a point value.

Example:

```text
Sarah — 8 points
Mike — 6 points
John — 4 points
```

The total points determine each worker's share.

Formula:

```text
worker share =
worker points / total points
```

## Method 4 — Weighted Hours

Allow each worker to have:

- Hours
- Weight/multiplier

Example:

```text
Sarah
8 hours
1.0 multiplier

Mike
8 hours
1.25 multiplier

John
8 hours
0.75 multiplier
```

Effective hours:

```text
Sarah = 8 × 1.0 = 8
Mike = 8 × 1.25 = 10
John = 8 × 0.75 = 6
```

Then divide based on effective hours.

---

# 8. MAKE CUSTOMIZATION EASY

The user should NOT have to understand complicated formulas.

Design the interface around simple choices:

```text
How should tips be split?

○ Equal
● By Hours
○ By Points
○ Weighted Hours
```

Then show only the relevant inputs.

For example, when "Points" is selected:

```text
Sarah       8 pts
Mike        6 pts
John        4 pts
```

When "Hours" is selected:

```text
Sarah       8h 30m
Mike        6h
John        7h 15m
```

---

# 9. ADJUSTMENTS

Consider supporting an optional adjustment feature.

For example:

```text
Sarah
8 hours
+ $20 adjustment
```

However, do NOT allow adjustments to create confusing or mathematically invalid results.

Clearly display how adjustments affect the final pool.

If this feature creates unnecessary complexity in the first implementation, implement it behind an "Advanced" section.

---

# 10. ROUNDING

This is extremely important.

The final worker amounts must add up exactly to the total tip pool.

For example:

```text
Total tips: $100.00
```

The displayed worker amounts must always total:

```text
$100.00
```

Never display:

```text
$99.99
```

because of floating-point rounding.

Use integer cents internally.

For example:

```text
10000 cents
```

rather than:

```text
100.00
```

Implement deterministic rounding.

If there is a leftover cent caused by rounding, use a documented deterministic method for allocating the remainder.

Add automated tests for this.

---

# 11. RESULTS SCREEN

After calculating, show a very clear results screen.

Example:

```text
Tip Split

$1,240.00
24.5 total hours

Sarah
Server
8.0 hrs

$404.90

Mike
Server
7.0 hrs

$354.29

John
Bartender
5.5 hrs

$278.37
```

Also display:

```text
Method
By Hours

Total Distributed
$1,240.00
```

The user should immediately understand who gets what.

---

# 12. VISUALIZATION

Consider including a simple visual breakdown.

For example:

```text
Sarah       32.7%
████████████████

Mike        28.7%
██████████████

John        22.4%
███████████
```

Keep this subtle and clean.

Do not make the app look like a financial dashboard.

It should feel like a fast restaurant utility.

---

# 13. EDITING

Results should be editable.

The user should be able to:

1. Go back
2. Change hours
3. Add/remove a worker
4. Change the calculation method
5. Change the tip amount

The results should recalculate immediately.

---

# 14. PREMIUM FEATURE

Create a premium subscription called something like:

**TipSplit Pro**

The free version should be useful on its own.

The premium version should primarily provide convenience features.

Premium features should include:

### Saved Workers

Users can save workers.

Example:

```text
My Team

Sarah
Server

Mike
Server

John
Bartender
```

Then when creating a new tip split, the user can quickly select workers instead of typing their names again.

This is the primary premium feature.

---

# 15. SAVED TEAMS

Consider allowing premium users to create teams.

Example:

```text
Teams

Friday Night Crew
Saturday Night Crew
Main Restaurant
Bar
```

A team contains saved workers.

Users can select:

```text
Start Tip Split
→ Select Team
→ Friday Night Crew
```

Then all workers are automatically populated.

This should dramatically reduce repetitive data entry.

---

# 16. HISTORY

Consider making calculation history a premium feature or partially premium feature.

Example:

```text
August 18
$1,240 tips
8 workers

August 17
$980 tips
7 workers

August 16
$1,105 tips
8 workers
```

A history item should store:

- Date/time
- Tip pool
- Workers
- Hours/points
- Calculation method
- Results

Be careful with privacy and data retention.

---

# 17. ACCOUNT SYSTEM

The basic calculator should NOT require an account.

For premium functionality, implement an account system.

A reasonable architecture is:

- Supabase Authentication
- Supabase Postgres
- Local storage for offline calculations
- Cloud synchronization for saved teams/workers

However, if you determine a better architecture, explain why and use it.

The app should still be useful if the user is offline.

---

# 18. SUBSCRIPTIONS

The app must support subscriptions appropriate for both:

- Apple App Store
- Google Play

Do NOT implement subscriptions by simply charging credit cards directly inside the mobile app.

Use the appropriate native app-store subscription infrastructure.

You may use a service such as RevenueCat if appropriate to simplify:

- Apple subscriptions
- Google Play subscriptions
- Entitlements
- Subscription state
- Restore purchases

Research the current requirements before implementation.

Create a subscription abstraction so the application isn't tightly coupled to the payment provider.

Example:

```text
SubscriptionService

isPremium()
purchasePremium()
restorePurchases()
```

---

# 19. FREE VS PREMIUM

Do not make the free version frustrating.

Suggested model:

### Free

- Unlimited basic calculations
- Equal split
- Hours-based split
- Points
- Weighted hours
- Basic worker entry
- Offline functionality

### TipSplit Pro

- Saved workers
- Saved teams
- Calculation history
- Cloud synchronization
- Additional convenience features

The exact division should be validated against current App Store/Google Play expectations and the product's business model.

---

# 20. ONBOARDING

Do not create a long onboarding process.

First launch:

```text
TipSplit

Split tips fairly.
In seconds.

[Get Started]
```

Then immediately take the user to the calculator.

Optionally show a short explanation:

```text
TipSplit calculates each worker's share
based on the method you choose.
```

---

# 21. DISCLAIMER

Include a concise disclaimer somewhere appropriate, such as Settings/About:

> TipSplit is a calculation tool and does not provide legal, tax, payroll, or employment advice. Tip-pooling and tip-sharing requirements vary by jurisdiction and workplace. Verify that your selected method complies with applicable laws and your organization's policies.

Do not make the disclaimer obnoxious during normal use.

---

# 22. DESIGN

The app should feel:

- Modern
- Clean
- Fast
- Professional
- Friendly
- Extremely easy to understand

Think:

- Restaurant utility
- Not enterprise software
- Not a spreadsheet
- Not a complicated accounting app

Prioritize:

- Large touch targets
- Large numbers
- Clear hierarchy
- Minimal typing
- Quick worker entry
- Excellent keyboard behavior
- Good mobile ergonomics

Use a polished design system with consistent:

- Typography
- Spacing
- Buttons
- Cards
- Input fields
- Icons
- Navigation

Support both:

- Light mode
- Dark mode

---

# 23. ACCESSIBILITY

Implement:

- Accessible labels
- Sufficient contrast
- Dynamic text where practical
- Large touch targets
- Screen-reader-friendly controls
- No reliance on color alone
- Proper keyboard navigation where applicable

---

# 24. ERROR HANDLING

Handle cases such as:

- No workers
- Zero tips
- Negative values
- Worker with zero hours
- All workers with zero hours
- Invalid point values
- Invalid weights
- Very large tip pools
- Decimal hours
- Minutes
- Currency formatting
- Rounding issues

Give useful user-facing errors.

Never allow NaN, Infinity, or broken calculations to appear.

---

# 25. TESTING

Create comprehensive unit tests for the calculation engine.

Test:

### Equal split

```text
$100 / 4 = $25 each
```

### Hours

```text
$100
8h
2h

→ $80
→ $20
```

### Points

```text
$100
8 points
2 points

→ $80
→ $20
```

### Weighted hours

```text
$100

8h × 1.0
8h × 2.0

→ $33.33
→ $66.67
```

### Rounding

Test many combinations where the result produces fractions of a cent.

Verify:

```text
sum(worker payouts) === total tips
```

in every valid case.

### Edge cases

Test:

- 1 worker
- 100+ workers
- 0 hours
- mixed zero/nonzero hours
- fractional hours
- very large amounts
- very small amounts

---

# 26. DATA MODEL

Create a clean data model.

For example:

```typescript
type Worker = {
  id: string;
  name: string;
  role?: string;
};

type WorkerInput = {
  workerId: string;
  hours?: number;
  minutes?: number;
  points?: number;
  weight?: number;
};

type TipSplit = {
  id: string;
  createdAt: string;
  totalTipsCents: number;
  method: SplitMethod;
  workers: WorkerInput[];
  results: TipResult[];
};
```

Adapt this as necessary.

Keep calculation inputs and outputs separate.

---

# 27. CALCULATION ENGINE

Create a pure calculation module.

For example:

```text
src/calculations/tipSplit.ts
```

It should not import React or depend on UI state.

It should be possible to test it independently.

Example conceptual API:

```typescript
calculateTipSplit({
  totalTipsCents,
  method,
  workers
})
```

Return:

```typescript
{
  results: [...],
  totalDistributedCents,
  method,
  metadata
}
```

---

# 28. CURRENCY

Support USD initially.

Architect the currency system so additional currencies could be added later.

Use proper locale-aware currency formatting.

Never perform financial calculations using JavaScript floating-point dollar values.

Use integer cents.

---

# 29. SETTINGS

Create a Settings screen containing:

- Currency
- Default split method
- Default worker role
- Subscription status
- Restore purchases
- Account
- Privacy
- Terms
- About
- Tip-pooling disclaimer

---

# 30. APP STORE READINESS

Prepare the project for actual deployment.

Include:

- App icon
- Splash screen
- Bundle/package identifiers
- App version
- Production configuration
- Environment variable handling
- iOS configuration
- Android configuration
- Privacy requirements
- Subscription configuration placeholders
- Store metadata placeholders

Do not hard-code API keys or secrets.

Create:

```text
.env.example
```

with explanations.

---

# 31. PRIVACY

Minimize data collection.

The basic calculator should require no personal information.

If accounts are used:

- Only collect necessary information.
- Explain what data is stored.
- Allow users to delete their account/data where required.
- Provide a privacy policy placeholder.
- Do not collect unnecessary analytics.

---

# 32. OFFLINE-FIRST

The core calculator MUST work without an internet connection.

The following should work offline:

- Adding workers
- Entering hours
- Calculating tips
- Changing calculation methods
- Viewing the current calculation

Premium cloud features can require connectivity.

---

# 33. PERFORMANCE

The calculator should feel instantaneous.

Avoid unnecessary network requests.

Do not send every keystroke to a backend.

Use local state for the active calculation.

---

# 34. DOCUMENTATION

Create:

```text
README.md
docs/tip-splitting-research.md
docs/architecture.md
docs/subscriptions.md
docs/app-store-deployment.md
docs/calculation-methods.md
```

README should explain:

- What TipSplit is
- Technology stack
- Development setup
- Environment variables
- Running locally
- Running on iOS
- Running on Android
- Testing
- Building production releases

---

# 35. DEVELOPMENT PROCESS

Do NOT immediately write the entire application blindly.

Follow this process:

## Phase 1 — Research

Research:

- Restaurant tip-splitting practices
- Common calculation methods
- Current tip-pooling considerations
- Apple subscription requirements
- Google Play subscription requirements
- Current Expo requirements
- Current React Native requirements

Save the findings.

## Phase 2 — Architecture

Design:

- Navigation
- Data model
- Calculation engine
- Storage
- Subscription abstraction
- Authentication
- Premium feature architecture

Document the architecture.

## Phase 3 — Calculation Engine

Build and test the calculation engine BEFORE building the UI.

Make sure all calculations and rounding are correct.

## Phase 4 — UI

Build the calculator.

Focus heavily on usability.

## Phase 5 — Persistence

Add local storage.

## Phase 6 — Premium

Add authentication, saved workers, teams, and history.

## Phase 7 — Subscriptions

Add the app-store subscription infrastructure.

## Phase 8 — Polish

Implement:

- Error states
- Empty states
- Loading states
- Accessibility
- Dark mode
- Animations where useful
- Keyboard handling
- Responsive layouts

## Phase 9 — Testing

Run all tests.

Fix TypeScript errors.

Fix lint errors.

Test on both Android and iOS where possible.

## Phase 10 — Production

Prepare the project for Expo Application Services / production builds.

Document exactly what is still required from the developer to submit to:

- Apple App Store Connect
- Google Play Console

---

# 36. IMPORTANT PRODUCT DECISIONS

Use these defaults unless research suggests a better approach:

### Default calculation

Hours-based proportional split.

### Default experience

No account required.

### Default storage

Local.

### Premium

Saved workers, saved teams, history, and cloud synchronization.

### Platform

React Native + Expo.

### Language

TypeScript.

### Currency

USD initially.

---

# 37. UX EXAMPLE

The ideal user experience should look roughly like:

```text
┌──────────────────────────────┐
│ TipSplit                     │
│                              │
│ How much did you collect?    │
│                              │
│       $1,240.00              │
│                              │
│ Split by                     │
│                              │
│ [ Equal ] [ Hours ]          │
│ [ Points ] [ Weighted ]      │
│                              │
│ Workers                      │
│                              │
│ Sarah      Server     8h     │
│ Mike       Server     7h     │
│ John       Bar        5.5h   │
│                              │
│ + Add Worker                 │
│                              │
│ ┌──────────────────────────┐ │
│ │     CALCULATE TIPS       │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Results:

```text
┌──────────────────────────────┐
│ Tip Split                    │
│                              │
│ $1,240.00                    │
│ Split by Hours               │
│                              │
│ Sarah                        │
│ 39.0%                        │
│ $483.60                      │
│                              │
│ Mike                         │
│ 34.1%                        │
│ $422.84                      │
│                              │
│ John                         │
│ 26.8%                        │
│ $333.56                      │
│                              │
│ Total          $1,240.00     │
│                              │
│ [ Edit ]       [ Done ]      │
└──────────────────────────────┘
```

---

# 38. IMPORTANT: DO NOT OVERENGINEER THE MVP

The most important feature is the calculator.

Do not let authentication, subscriptions, analytics, cloud synchronization, or settings make the basic calculator complicated.

The user should be able to launch the app and calculate tips immediately.

Prioritize:

1. Excellent calculator
2. Excellent worker entry
3. Accurate calculations
4. Great results presentation
5. Saved workers
6. Premium features
7. Everything else

---

# 39. IMPLEMENTATION REQUIREMENT

Start by inspecting the current repository.

If the repository is empty, initialize the project appropriately.

Before making major architectural decisions:

1. Research current best practices.
2. Explain the proposed architecture briefly.
3. Create the documentation.
4. Then implement.

Do not stop after creating a plan.

Actually build the application.

After implementation:

- Run the tests.
- Run TypeScript checks.
- Run linting.
- Fix errors.
- Verify the calculation engine.
- Verify navigation.
- Verify persistence.
- Verify premium feature boundaries.
- Verify the production build configuration.

At the end, provide a concise summary of:

- What was built
- Architecture
- Calculation methods
- Premium features
- Research findings
- Tests performed
- Remaining setup required for Apple
- Remaining setup required for Google
- Any API keys/secrets/configuration I still need to provide

The result should be a **production-quality TipSplit application**, not merely a demo.