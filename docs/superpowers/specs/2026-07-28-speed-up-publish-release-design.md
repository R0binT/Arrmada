# Speed up Publish release (same infra) — Design

Date: 2026-07-28  
Status: Approved (conversation — approach A)

## Goal

Cut GitHub Actions **Publish release** wall time as much as possible **without** changing infra (stay on `ubuntu-latest`, no EAS, no self-hosted / larger runners).

## Evidence (v1.1.4 run `30386675683`)

| Step | ~Duration | Cause |
|------|-----------|--------|
| Build APK with Gradle | ~22 min | Cold RN/Expo native compile; Gradle User Home cache miss |
| Post Cache Android SDK | ~12 min | Cache key includes `app.json` → miss every version bump; saves NDK-heavy tree |
| Everything else | ~2 min | Fine |

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Infra | Unchanged (`ubuntu-latest`) |
| Android SDK `actions/cache` | **Remove** (net slowdown today) |
| `android-actions/setup-android` | **Remove**; use runner `ANDROID_HOME` + install only missing packages needed for release |
| Emulator / full SDK reinstall | Do not install |
| Gradle cache | Keep `gradle/actions/setup-gradle` with `cache-read-only: false` |
| Gradle flags | `--build-cache --parallel`; set `org.gradle.caching` / `org.gradle.parallel` / reasonable JVM heap after prebuild |
| Configuration cache | Out of scope (often breaks Expo/RN) |
| Commit `android/` | Out of scope |
| EAS / bigger runners | Out of scope |

## Workflow shape

1. Checkout, resolve version, Node, JDK 17 (unchanged).
2. Ensure Android SDK packages: accept licenses; `sdkmanager` install only what is missing (platform-tools, `platforms;android-*` as required by prebuild, `build-tools;36.1.0` from `expo-build-properties`).
3. Setup Gradle (writable cache).
4. `npm ci` → `expo prebuild --platform android --clean` → `assembleRelease --build-cache --parallel`.
5. Package APK + GitHub Release (unchanged).

## Success criteria

- No `actions/cache` Android SDK step (no multi-minute post-job SDK upload).
- Next release wall time clearly below ~36 min; expect **~15–25 min** depending on Gradle cache hit.
- Release still produces `Arrmada-{VERSION}.apk` on tag `v{VERSION}`.

## Out of scope

- Changing release trigger / prepare-release flow
- iOS
- Paying for faster runners or EAS
