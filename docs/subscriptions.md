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

### Resolved: local Android dev-client build fails on Windows — use EAS cloud build instead

`npx expo run:android` fails on this machine (Windows) with:

```
ninja: error: '…/react-native-worklets/…/libworklets.so', needed by
'…/libexpo-modules-core.so' (or libreanimated.so), missing and no known rule to make it
```

This is an unresolved **upstream** bug in the Expo SDK 57 / `react-native-worklets` native-build
integration on Windows — tracked at [expo/expo#42892](https://github.com/expo/expo/issues/42892)
and [#42893](https://github.com/expo/expo/issues/42893), not something introduced by this
project. Ruled out as the cause: wrong dependency versions (`react-native-reanimated@4.5.0` +
`react-native-worklets@0.10.4` is the correct pairing for `expo-modules-core@57.0.12`), stale
build cache (reproduces on a fully clean `rm -rf android` + fresh prebuild), a community nightly
workaround, and Gradle's `--configure-on-demand` flag.

**Fix: build on EAS's Linux servers instead of locally.** `eas build --platform android --profile
production` succeeds cleanly — same `npm ci`-then-Gradle pipeline, but Linux doesn't hit whatever
Windows-specific path/ordering issue triggers the Ninja error. This is now the standard way to
build this project; don't spend time on `npx expo run:android`/`run:ios` locally on Windows.

One extra fix was needed for EAS's install step specifically: it runs a strict `npm ci`, which
failed on a react-dom/`@radix-ui` peer conflict from `expo-router`'s bundled (unused) web
dependency tree — the same conflict we'd been bypassing locally with `--legacy-peer-deps`. Fixed
by adding `.npmrc` with `legacy-peer-deps=true` at the project root (npm reads this automatically,
including during `npm ci`).

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

## Google Play Console state (as of 2026-08-24)

- App **TipSplit** created (`com.tipsplit.app`), owned by developer account "Nate Lehnhof".
- EAS build `c8ed4425` (versionCode 3, commit `59cdb55`) built successfully on EAS's cloud
  builders and was uploaded to the **Internal testing** track — release "3 (1.0.0)" is live
  there (`Available to internal testers`). No testers have been added yet, so it isn't visible to
  anyone until testers are added on the Internal testing → Testers tab.
- Real subscription product created: **`tipsplit_pro_monthly`**, base plan `monthly`
  (auto-renewing, monthly, 7-day grace period), **Active**, priced at $4.99 USD with regional
  pricing auto-converted for all 177 available countries/regions.

## Google Cloud service account state (as of 2026-08-23)

- Service account `revenuecat-play-publisher@tipsplit-506501.iam.gserviceaccount.com` created in
  GCP project `tipsplit-506501`. Key downloaded as `google-play-service-account.json` (gitignored,
  project root — never commit).
- Play Console → Users and permissions: this service account is added as a user with **app-scoped**
  access to TipSplit only (not account-wide), granted: View app information, View app quality
  information, View financial data, Manage orders and subscriptions, Release apps to testing
  tracks. Deliberately **not** granted "Release to production" (least-privilege — internal
  testing/staging only for now).
- Cloud Pub/Sub API enabled on the project; service account also granted the **Pub/Sub Editor**
  IAM role at the project level, for RevenueCat's "Google developer notifications" (real-time
  purchase/renewal/cancellation webhook) feature.
- `eas.json`'s `submit.production.android` points at the local `google-play-service-account.json`
  (`serviceAccountKeyPath`) with `track: "internal"`, so `eas submit --platform android` can
  upload future builds straight to Internal testing without going through the Play Console UI.

## What's still required before this goes live

1. **RevenueCat credential validation is currently stuck on Google-side propagation delay.**
   Confirmed directly in Play Console that the service account has both "View financial data" and
   "Manage orders and subscriptions" on the TipSplit app (screenshotted and verified checkbox-by-
   checkbox) — this is not a misconfiguration. RevenueCat's "Check credentials" still reports only
   one failing check: **"Can validate Google Play subscription purchases"** (the other two —
   reading the in-app product catalog and the subscription/base-plan catalog — pass). Google's own
   documentation and community reports note this specific permission (`Manage orders and
   subscriptions`, used for the purchases.subscriptions.get API) can take a few hours to fully
   propagate after being granted, even though the Play Console UI shows it as granted immediately.
   **Next step: periodically click "Check again" on the RevenueCat app config page
   (`app.revenuecat.com/projects/e27797bb/apps/app6982788c41`) — no further Play Console/GCP
   changes are believed to be needed.** Once it passes: add a product entry for
   `tipsplit_pro_monthly` under this Play Store app in RevenueCat and attach it to the `pro`
   entitlement / `default` offering (currently only wired to the Test Store product), then connect
   "Google developer notifications" (Pub/Sub topic) on the same page now that the IAM role is
   granted.
2. **iOS is paused, not blocked** — the $99 Apple Developer Program membership purchase has been
   submitted and is processing (can take up to 48h). Per explicit instruction, no Apple/iOS work
   (App Store Connect app record, StoreKit product, RevenueCat Apple app, iOS EAS build) starts
   until the user confirms enrollment finished.
3. **A paywall UI review** — the current paywall (`src/app/paywall.tsx`) is functional but plain;
   consider RevenueCat's Paywalls tool (visible in the left nav) once the Android RevenueCat
   product is wired, since it can be updated remotely without an app release.
4. **`.env` handling for CI/EAS builds** — `EXPO_PUBLIC_REVENUECAT_API_KEY_*` need to be set as
   EAS secrets (`eas secret:create`) for production builds; `.env` itself is gitignored and never
   committed. Not yet done — the build above shipped without RevenueCat keys set, so it still runs
   on the local dev-mode Pro toggle.
5. **Play Console warnings to eventually address** (non-blocking): no deobfuscation/mapping file
   uploaded for R8/ProGuard crash symbolication; no privacy policy URL or store listing filled in
   yet (required before promoting past internal testing); no testers added yet to the Internal
   testing track, so the uploaded build isn't visible to anyone.
