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
- Offer **`7-day-free-trial`** added to the `monthly` base plan and **Active**: a 7-day free
  trial phase, eligibility "New customer acquisition" (`Never had this subscription`), available
  in all 174 countries the base plan covers. `src/app/paywall.tsx` reflects this in its copy
  ("Try free for 7 days" / "Start free trial" / cancel-anytime disclaimer). Once RevenueCat's
  Play Store connection is validated (see below) and the real product is attached to the `pro`
  entitlement, this trial is picked up automatically — no separate RevenueCat-side trial config
  needed for Android.
- Internal testing track has one tester: `j.lehnhof01@gmail.com` (list `TipSplit_Testers`), track
  is now **Active**.

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

1. **Android RevenueCat integration is now fully connected end-to-end (as of 2026-08-24).**
   - Credential validation passes ("✓ Valid credentials") — was blocked purely on Google-side IAM
     propagation delay, not a misconfiguration.
   - Google developer notifications connected: topic `Play-Store-Notifications`
     (`projects/tipsplit-506501/topics/Play-Store-Notifications`), status "Connected to Google".
     Required **both** `Pub/Sub Editor` and `Monitoring Viewer` IAM roles on the service account
     (only Editor was granted initially, per RevenueCat's troubleshooting guide) — the second
     attempt after adding `Monitoring Viewer` succeeded once IAM propagated.
   - Real product imported: `tipsplit_pro_monthly:monthly` (RevenueCat's `<product_id>:<base_plan_id>`
     naming) is Published under the "TipSplit (Play Store)" app and attached to the `pro`
     entitlement.
   - The `default` offering's `$rc_monthly` package now maps to **both** the Test Store product
     (for local/dev testing) and the real Play Store product (for production) — one product per
     store app, same package.
   - **Remaining non-blocking items:** paywall UI polish (RevenueCat's Paywalls tool), EAS secrets
     for `EXPO_PUBLIC_REVENUECAT_API_KEY_*` in CI builds, Play Console store listing content
     (privacy policy, screenshots) before promoting past Internal testing.
2. **iOS is now in progress (started 2026-08-24).** Apple Developer Program membership is active
   (License Agreement accepted 2026-08-23). Progress so far:
   - **Bundle ID**: `com.tipsplit.app` was already taken globally on Apple's platform (unrelated
     account) — registered `com.lehnhofsolutions.tipsplit` instead as the App ID in Certificates,
     Identifiers & Profiles. `app.json`'s `ios.bundleIdentifier` updated to match. Android's
     package name (`com.tipsplit.app`) is unaffected — the two platforms don't share a namespace.
   - **App Store Connect app record** created: display name `TipSplit: Tip Splitter` (the plain
     "TipSplit" name was also already taken globally), SKU `tipsplit-ios`, Apple app ID
     `6804705644`.
   - **StoreKit subscription** created: group "TipSplit Pro" → subscription `TipSplit Pro Monthly`
     (Apple ID `6804706562`), product ID `tipsplit_pro_monthly` (matches the Android product ID
     for consistency, though the namespaces are separate), 1-month duration, $4.99 USD base price
     with regional pricing auto-converted for all 175 countries/regions, localized display
     name/description (English U.S.), status "Prepare for Submission" — Apple requires a
     subscription's first submission to go out with an app build, so this stays in that state
     until an app version reaches TestFlight/review.
   - **7-day free introductory offer** added (mirrors the Android offer): "Free for the first
     week", all 175 countries, start date 2026-08-24, no end date.
   - **Still to do**: create the RevenueCat "App Store" app under Project Settings → Apps (needs
     an App Store Connect API key or in-app purchase key for server-side receipt validation),
     import/attach `tipsplit_pro_monthly` to the `pro` entitlement and `default` offering, run an
     iOS EAS build (`eas build --platform ios` — first run will need Apple signing
     credentials/certificates, which EAS can generate and manage), upload to TestFlight, and
     submit the app + subscription together for App Review.
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
