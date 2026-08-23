# Subscriptions

TipSplit Pro is gated behind a `SubscriptionService` abstraction
(`src/services/subscription/types.ts`) so the app is never coupled to a specific payment
provider:

```ts
type SubscriptionService = {
  isPremium(): Promise<boolean>;
  purchasePremium(): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
};
```

`SubscriptionContext` (`src/services/subscription/SubscriptionContext.tsx`) picks which
implementation backs the app at startup:

- **`localDevSubscriptionService`** — a local, on-device flag (AsyncStorage), toggled from
  Settings → Developer → "Simulate Premium". Used whenever no RevenueCat API key is configured.
  This is how the free MVP build and Expo Go development both work — no native module, no store
  account required.
- **`revenueCatSubscriptionService`** — the real implementation, backed by
  [`react-native-purchases`](https://www.revenuecat.com/docs/getting-started/installation/reactnative).
  Used automatically once `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` and/or
  `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` are set (see `.env.example`).

`react-native-purchases` is a **native module** — it does not work in Expo Go. Once a RevenueCat
API key is set, you need a dev client build (`npx expo run:android` / `npx expo run:ios`, or an
EAS development build) to test it locally.

**Don't set a real API key for local Expo Go development.** If `EXPO_PUBLIC_REVENUECAT_API_KEY_*`
is set, `SubscriptionContext` picks `revenueCatSubscriptionService`, which tries to load the
native module immediately on app start — this crashes in Expo Go. Keep `.env` absent (or both
keys blank) for everyday `npm start` development; only set them when actually running a dev
client build.

### Known blocker: local Android dev-client build fails (2026-08-23)

`npx expo run:android` currently fails on this machine (Windows) with:

```
ninja: error: '…/react-native-worklets/…/libworklets.so', needed by
'…/libexpo-modules-core.so' (or libreanimated.so), missing and no known rule to make it
```

This is a currently-unresolved **upstream** bug in the Expo SDK 57 / `react-native-worklets`
native-build integration — tracked at
[expo/expo#42892](https://github.com/expo/expo/issues/42892) and
[#42893](https://github.com/expo/expo/issues/42893), not something introduced by this project.
Confirmed NOT caused by:

- Wrong dependency versions — `react-native-reanimated@4.5.0` + `react-native-worklets@0.10.4` is
  the correct pairing within `expo-modules-core@57.0.12`'s supported peer range (4.6.0 pulls
  worklets `0.12.x`, which is *outside* that range and fails differently/earlier).
- Stale build cache — reproduces on a fully clean `rm -rf android` + fresh `expo prebuild`.
- A community-reported nightly workaround (`react-native-worklets@0.8.0-nightly-20260210-*`) —
  tried, same failure class (a different consumer, `libreanimated.so`, hit the same missing-`.so`
  error).
- Gradle's `--configure-on-demand` flag — disabled via `org.gradle.configureondemand=false` and
  ran `gradlew` directly (bypassing `expo run:android`'s flags); same failure.

**Next thing to try, not yet attempted:** an EAS cloud build (`eas build --profile development
--platform android`) instead of a local build — EAS's Linux build containers may not hit this
same native-build path/ordering issue. Needs an EAS account (free) to test.

**What still works despite this:** everything except the local native dev-client build. The
RevenueCat dashboard config (below) is real and verified via the dashboard UI. The code
(`revenueCatSubscriptionService.ts`, `SubscriptionContext.tsx`) is written and type-checks/lints
clean; it's simply untested end-to-end pending a working native build. The free app and the local
dev-mode Pro toggle (Expo Go) are completely unaffected.

## RevenueCat dashboard state (as of 2026-08-23)

Project **TipSplit** (`app.revenuecat.com/projects/e27797bb`) is configured against RevenueCat's
built-in **Test Store** — a fully virtual store that requires no App Store Connect or Play Console
product setup, so real purchases can be tested end-to-end before either store app exists:

| Object | Identifier | Notes |
|---|---|---|
| Entitlement | `pro` | Display name "TipSplit Pro" |
| Product | `tipsplit_pro_monthly` | Auto-renewing subscription, Monthly, $4.99 USD, Test Store |
| Offering | `default` (current) | Contains one package, `$rc_monthly` → `tipsplit_pro_monthly` |

The entitlement identifier `pro` is hard-coded in `revenueCatSubscriptionService.ts`
(`ENTITLEMENT_ID`) — if it's ever renamed in the dashboard, update that constant too.

The account's email was not yet confirmed at time of setup (a banner in the dashboard flags this)
— confirm it before relying on dashboard email notifications (e.g. billing alerts).

## What's still required before this goes live

0. **A working native build to actually test the above** — see "Known blocker" above. Try an EAS
   cloud build next.
1. **Real store products.** The Test Store config above only proves the RevenueCat/SDK wiring
   works. Before shipping, create matching subscription products in:
   - **Google Play Console** (already have a developer account) — a subscription product with
     the same duration/price intent, likely reusing `tipsplit_pro_monthly` as the product ID.
   - **App Store Connect** (needs Apple Developer Program enrollment first — not yet done).
   Then create a real "Play Store" / "App Store" app entry in RevenueCat's Apps page and attach
   those store products to the same `pro` entitlement and `default` offering.
2. **Apple Developer Program enrollment** ($99/yr + identity verification) — blocks iOS
   entirely, including TestFlight.
3. **A paywall UI review** — the current paywall (`src/app/paywall.tsx`) is functional but plain;
   consider RevenueCat's Paywalls tool (visible in the left nav) once real products exist, since
   it can be updated remotely without an app release.
4. **`.env` handling for CI/EAS builds** — `EXPO_PUBLIC_REVENUECAT_API_KEY_*` need to be set as
   EAS secrets (`eas secret:create`) for production builds; `.env` itself is gitignored and never
   committed.
