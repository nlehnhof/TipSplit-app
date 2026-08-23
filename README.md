# TipSplit

A restaurant tip-splitting calculator: enter the pool, enter who worked and how long, see what
everyone gets. The core calculator requires no account and works fully offline.

Full product spec: [`TipSplit_prompt.md`](./TipSplit_prompt.md). Build plan: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md).

## Tech stack

- [Expo](https://docs.expo.dev/) SDK 57 + [Expo Router](https://docs.expo.dev/router/introduction/)
- React Native 0.86, React 19, TypeScript (strict mode)
- Jest (`jest-expo` preset) for unit tests
- ESLint (`eslint-config-expo`) + Prettier

## Development setup

```bash
npm install
npm start
```

Then press `i` for the iOS simulator, `a` for Android, or `w` for web — or scan the QR code with
Expo Go on a physical device.

```bash
npm run ios      # expo start --ios
npm run android  # expo start --android
npm run web      # expo start --web
```

No environment variables are required for local development — without them, Pro features run on
a local dev-mode toggle (Settings → Developer) instead of real billing, and `npm start` (Expo Go)
works normally. To test real RevenueCat purchases, copy `.env.example` to `.env` and see
`docs/subscriptions.md`; this requires a dev client build (`npm run android:dev-client` /
`ios:dev-client`) since `react-native-purchases` is a native module Expo Go can't load — **local
Android dev-client builds are currently blocked by an upstream Expo bug**, see "Known blocker" in
`docs/subscriptions.md` before spending time on this.

## Testing, linting, type checking

```bash
npm test          # run the Jest suite once
npm run test:watch
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
npm run format     # prettier --write .
```

The calculation engine (`src/calculations/tipSplit.ts`) is the most heavily tested part of the
app — see `docs/calculation-methods.md` for the rounding/allocation contract it guarantees.

## Building for production

`eas.json` has development/preview/production build profiles configured. App icons and store
metadata are still Expo's defaults. See "What's not built yet" in `docs/architecture.md`.

## Docs

- [`docs/architecture.md`](./docs/architecture.md) — folder structure, engine/UI boundary, what's built vs. not
- [`docs/calculation-methods.md`](./docs/calculation-methods.md) — the four split methods, rounding, adjustments, error cases
- [`docs/subscriptions.md`](./docs/subscriptions.md) — SubscriptionService abstraction, RevenueCat dashboard state, what's left before launch
- [`docs/tip-splitting-research.md`](./docs/tip-splitting-research.md) — tip-pooling practices and legal research behind the disclaimer
