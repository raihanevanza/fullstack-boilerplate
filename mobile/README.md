# Mobile (React Native)

Android + iOS client for the boilerplate API: sign in, a home dashboard, a product catalog with
create / edit / delete for users that hold the `product.write` permission, and a profile screen with
language and theme settings. It talks to the backend through the contract in [docs/API.md](../docs/API.md).

## Stack

| Part | Technology |
| --- | --- |
| Runtime | React Native 0.87.1, React 19.2, **New Architecture** (Fabric, TurboModules, bridgeless; the only architecture since 0.82), Hermes |
| Language | TypeScript (strict), `@/` import alias (babel-plugin-module-resolver) |
| Navigation | React Navigation 7 (native stack + bottom tabs), react-native-screens |
| State & API | Redux Toolkit + RTK Query (infinite queries for paginated lists) |
| Session | react-native-keychain (iOS Keychain / Android Keystore); preferences in AsyncStorage |
| UI | Violet design tokens with dark mode, Plus Jakarta Sans (OFL, `assets/fonts`), react-native-svg (charts, logo), lucide-react-native (icons) |
| i18n | English (default) and Indonesian, `src/core/i18n` |
| Tooling | Jest, ESLint (`@react-native`), Prettier |

## Features

- **Login** with tappable demo-account cards in development builds (`env.showDemoAccounts`).
- **Home**: product counts, inventory value, a donut chart of product status (in stock / low stock / inactive) and the latest products, all from `GET /api/dashboard`.
- **Products**: infinite list with debounced search, an All / Active only filter and pull to refresh. Detail screen, and a create / edit form with client-side validation that mirrors the backend rules. Delete asks for confirmation. Write actions only appear when `permissions` (from `/api/auth/me`) contains `product.write`; the app never checks roles.
- **Profile**: user info, role and permissions, language (EN / ID), theme (system / light / dark), sign out.
- Any `401` from the API signs the user out and clears the stored token and cached data.

## Prerequisites

- **Node 22.11 or newer** (`nvm use` reads [.nvmrc](.nvmrc)).
- **Android**: JDK 17, Android SDK with **platform 37 (compileSdk) + build-tools 37.0.0** and **NDK 27.1.12297006**, as required by React Native 0.87. Install them up front from Android Studio's SDK Manager; Gradle can download missing pieces itself, but that is slow. Make sure `ANDROID_HOME` points at the SDK (or create `android/local.properties` with `sdk.dir=...`).
- **iOS** (macOS only): Xcode 16 or newer with an iOS simulator runtime, Ruby, and Bundler. CocoaPods is installed per project through the [Gemfile](Gemfile), no global `pod` needed.
- The backend running on port 8080 (see the root README).

## Run

```sh
cd mobile
npm install
npm start            # Metro bundler, keep it running
```

### Android emulator

```sh
npm run android      # builds, installs and launches on the running emulator / device
```

The first build takes a while. On a machine with little RAM you can build a single ABI:
`cd android && ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a` (use `x86_64` for an Intel emulator).

### iOS simulator

```sh
# once per machine
sudo xcodebuild -license accept && sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS                  # simulator runtime

# once per clone, and after adding or upgrading a native library
bundle config set --local path vendor/bundle
bundle install
cd ios && LANG=en_US.UTF-8 bundle exec pod install && cd ..

npm run ios                                       # or open ios/BoilerplateApp.xcworkspace in Xcode
```

A physical iPhone and App Store builds need an Apple Developer account and signing configured in
Xcode (target `BoilerplateApp` → Signing & Capabilities).

## Configuration

Everything environment-specific lives in [src/app/env.ts](src/app/env.ts):

| Setting | Development (`__DEV__`) | Production |
| --- | --- | --- |
| `apiBaseUrl` | Android emulator `http://10.0.2.2:8080/api`, iOS simulator `http://localhost:8080/api` | `https://api.example.com/api` (replace before a release build) |
| `showDemoAccounts` | `true` | `false` |

On a physical Android device either run `adb reverse tcp:8080 tcp:8080` and use `localhost`, or put your
machine's LAN IP in `env.ts`. Cleartext HTTP is allowed only in debug builds on Android, and only for local
networking on iOS (`NSAllowsLocalNetworking`).

Demo accounts (seeded by `db/init/02_seed_dev.sql`, password `Password123!`):

- `admin@example.com`: ADMIN, can create, edit and delete products
- `staff@example.com`: STAFF, read only

## Scripts

```sh
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # jest: API client, session (401 sign-out), product form rules, i18n and formatting
```

## Structure

```
src/
  app/          App root, Redux store, navigation, env, bootstrap (prefs, then session)
  core/
    api/        http.ts (the only fetch call: headers, timeout, envelope, errors), baseQuery, RTK Query api, types
    auth/       Keychain session, session slice, login / restore / logout thunks, useCan()
    format/     number, currency and date formatters per language
    i18n/       en.ts (source of keys), id.ts, translate(), useT()
    prefs/      language + theme preferences (AsyncStorage)
    theme/      color tokens (light / dark), typography (font()), useTheme()
  features/
    auth/       LoginScreen
    home/       HomeScreen, DonutChart
    products/   list, detail, form screens, ProductRow, productForm.ts (validation + mapping)
    profile/    ProfileScreen
  shared/       reusable UI kit: AppText, Badge, Banner, Button, Card, ChipGroup, ConfirmDialog, InfoList,
                ListState, Logo, PageHeader, Screen, SearchBar, Segmented, TextField, notify, useInfiniteList
__tests__/      Jest tests
assets/fonts/   Plus Jakarta Sans (licensed under the SIL OFL, see assets/licenses)
android/  ios/  native projects
```

Conventions:

- Screens never call `fetch` or read the token; every request goes through `core/api` (adds `Authorization`, `Accept-Language`, `X-Platform: mobile`, a 15 s timeout, and turns the error envelope into a typed `ApiErrorData`).
- Text uses `<AppText>` or the `font('semibold')` helper from `core/theme/typography.ts`, never `fontWeight`: Android picks custom fonts by family name.
- Colors come from `useTheme()`, so every screen works in light and dark mode.
- New strings go into both `en.ts` and `id.ts` (a test checks the keys match).

### Fonts

Fonts live in `assets/fonts` and are linked through `react-native.config.js`. After adding or replacing a
font run `npx react-native-asset` (copies them to Android and registers `UIAppFonts` on iOS), then rebuild.

## Renaming the app for a new project

The defaults are: JS/native component name `BoilerplateApp`, display name `Boilerplate`, Android
`applicationId` / namespace / Kotlin package and iOS bundle id `com.example.boilerplate`.

1. **Display name**: `app.json` (`displayName`), `android/app/src/main/res/values/strings.xml` (`app_name`), `ios/BoilerplateApp/Info.plist` (`CFBundleDisplayName`), and `APP_NAME` in `src/shared/Logo.tsx`.
2. **Android application id**: in `android/app/build.gradle` change `namespace` and `applicationId`, move `android/app/src/main/java/com/example/boilerplate/` to the new package path and update the `package` line in `MainActivity.kt` and `MainApplication.kt`.
3. **iOS bundle id**: `PRODUCT_BUNDLE_IDENTIFIER` in `ios/BoilerplateApp.xcodeproj/project.pbxproj` (or Xcode → target → Signing & Capabilities).
4. **Keychain service**: `SERVICE` in `src/core/auth/secureSession.ts`.
5. **Component / project name** (optional, more invasive): the name in `app.json` must match `getMainComponentName()` in `MainActivity.kt` and `withModuleName` in `ios/BoilerplateApp/AppDelegate.swift`. To rename the Xcode project too, rename `ios/BoilerplateApp/`, `BoilerplateApp.xcodeproj`, `BoilerplateApp.xcworkspace` and the scheme file, replace `BoilerplateApp` inside `project.pbxproj`, the `.xcscheme`, `contents.xcworkspacedata`, `LaunchScreen.storyboard` and the `target` in `ios/Podfile`, update `rootProject.name` in `android/settings.gradle`, then delete `ios/Pods` and run `bundle exec pod install` again.
6. Update `name` in `package.json`, then run `npm run typecheck && npm test` and a clean native build (`cd android && ./gradlew clean`, and delete `ios/build`).
