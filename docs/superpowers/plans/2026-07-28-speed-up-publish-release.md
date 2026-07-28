# Speed up Publish release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut Publish release wall time on `ubuntu-latest` by removing the slow Android SDK cache and avoiding full `setup-android` reinstalls.

**Architecture:** Slim `publish-release.yml`: runner SDK + targeted `sdkmanager` installs; keep writable Gradle cache; parallel/`--build-cache` assemble.

**Tech Stack:** GitHub Actions, JDK 17, Android SDK on ubuntu-latest, Gradle, Expo prebuild.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-speed-up-publish-release-design.md`
- Same infra: `ubuntu-latest` only
- Do not call the product “MVP”
- Keep APK naming `Arrmada-{VERSION}.apk` and release trigger unchanged

## File map

| File | Responsibility |
|------|----------------|
| `docs/superpowers/specs/2026-07-28-speed-up-publish-release-design.md` | Locked design |
| `.github/workflows/publish-release.yml` | Faster publish job |

---

### Task 1: Rewrite Publish release Android setup

**Files:**
- Modify: `.github/workflows/publish-release.yml`

- [ ] Remove `android-actions/setup-android` and `actions/cache` Android SDK steps
- [ ] Add step: accept licenses + `sdkmanager` for `platform-tools`, `build-tools;36.1.0`, `platforms;android-35`, `platforms;android-36` (idempotent)
- [ ] Keep `ANDROID_HOME: /usr/local/lib/android/sdk`
- [ ] Keep `gradle/actions/setup-gradle` with `cache-read-only: false`
- [ ] After prebuild, append `org.gradle.caching=true` and `org.gradle.parallel=true` (and sensible `jvmargs`) to `android/gradle.properties` if missing
- [ ] Run `./gradlew assembleRelease --build-cache --parallel`

**Verify:** YAML validates locally (`actionlint` if available) / visual review of workflow.

### Task 2: Land via PR

- [ ] Branch `ci/speed-up-publish-release`
- [ ] Commit design + workflow
- [ ] Open PR with summary, test plan (next release timing)
