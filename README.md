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

No environment variables are required yet — the app has no backend. `.env.example` will be added
once authentication/subscriptions (Phase 7–8 of `EXECUTION_PLAN.md`) are implemented.

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

Not yet configured — no EAS build profiles, app icons, or store metadata exist yet. See
"What's not built yet" in `docs/architecture.md`.

## Docs

- [`docs/architecture.md`](./docs/architecture.md) — folder structure, engine/UI boundary, what's built vs. not
- [`docs/calculation-methods.md`](./docs/calculation-methods.md) — the four split methods, rounding, adjustments, error cases
