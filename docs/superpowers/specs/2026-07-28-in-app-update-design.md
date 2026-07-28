# In-app update (Settings → About) — Design

Date: 2026-07-28  
Status: Approved (conversation)

## Goal

Add an **About** section in Settings → Preferences with app metadata and a button that checks GitHub Releases for a newer Android APK, then downloads and installs it after user confirmation. If already current, tell the user they are up to date.

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Placement | Preferences → **À propos** (bottom, after Appearance) |
| About content | App name, version, author, license, repo link, update button |
| Update UX | Confirm dialog before download (option A) |
| Distribution source | Public repo **`R0binT/Arrmada`** GitHub Releases |
| APK asset name | `Arrmada-{VERSION}.apk` (matches publish workflow) |
| Platforms | **Android only** (no iOS/web branching for update) |
| Auto-check on launch | Out of scope |
| Release notes UI | Out of scope |
| Auth to GitHub | None (public API) |

## UI — About card

In `app/(tabs)/settings/preferences.tsx`, after the Appearance surface, add an `AboutCard` (same `Surface` / raised pattern as other preference cards):

| Element | Content |
|---------|---------|
| Title | À propos / About |
| App name | Arrmada |
| Version | `v{version}` from native / Expo config (`expo-constants`) |
| Author | R0binT — tappable → `https://github.com/R0binT` |
| License | PolyForm Noncommercial 1.0.0 — tappable → PolyForm license URL |
| Repository | “View on GitHub” → `https://github.com/R0binT/Arrmada` |
| Action | Button **Check for updates** — disabled + loading while checking/downloading |

Links open via existing app patterns (`Linking` / in-app browser as elsewhere).

## Update flow

1. User taps **Check for updates** → loading.
2. `GET https://api.github.com/repos/R0binT/Arrmada/releases/latest`.
3. Parse tag (`v1.2.3` → `1.2.3`), compare to local app version (semver).
4. **Local ≥ latest** → Alert: already up to date (show current version).
5. **Latest > local** → Alert: “Version X.Y.Z available (current: Y.Y.Y). Download and install?” → Cancel / Install.
6. On **Install**: download `Arrmada-{version}.apk` (progress text if practical) → open Android package installer intent.
7. System handles “install unknown apps” permission and the install confirmation UI.

## Architecture

```
src/features/app-update/
  compare-semver.ts
  fetch-latest-release.ts
  download-and-install-apk.ts
  use-app-update.ts
  types.ts

src/features/settings/AboutCard.tsx  (or under app-update if preferred)
```

| Unit | Responsibility |
|------|----------------|
| `compare-semver` | Pure `MAJOR.MINOR.PATCH` compare; strip leading `v` |
| `fetch-latest-release` | GitHub latest release → `{ version, apkUrl, tag }` or typed failure |
| `download-and-install-apk` | Download via `expo-file-system`; launch install intent |
| `use-app-update` | UI state machine: idle / checking / upToDate / available / downloading / error |
| `AboutCard` | Presentation + wire hook + i18n |

**Constants:** owner `R0binT`, repo `Arrmada`, asset pattern `Arrmada-{version}.apk`.

**Dependencies:** `expo-file-system`; Android install via Expo-compatible intent helper (`expo-intent-launcher` or equivalent for Expo 57); `REQUEST_INSTALL_PACKAGES` (or documented equivalent) in Android config if required for sideload install.

## Error messages (user-facing)

Keep only three user-visible outcomes besides success paths:

| Case | Message intent (i18n FR/EN) |
|------|-----------------------------|
| Download failed | Failure of the download |
| Install intent / unknown-apps permission | Cannot open installer — enable install unknown apps for Arrmada |
| Everything else (network, API, missing asset, bad version, etc.) | One generic message: cannot check or apply the update |

Technical detail stays in code/logs for debugging, not in the Alert body.

Success paths:

- Already up to date
- Confirm-before-download dialog
- (Optional) brief “Downloading…” during transfer

## i18n

All About + update strings in `src/i18n/locales/fr.ts` and `en.ts` under `settings.about.*` / `settings.update.*` (exact keys chosen at implementation).

## Testing

**Unit (Jest)**

- `compare-semver`: equal, major/minor/patch newer/older, leading `v`
- `fetch-latest-release` with mocked `fetch`: happy path, HTTP error, missing APK asset, malformed tag
- Decision “available vs up to date” from fixed local version

**Manual (Android device/emulator)**

- Already up to date → message
- Newer release (or mocked) → confirm → download → system installer
- Offline → generic error
- Denied install permission → permission-specific message

## Out of scope

- iOS / web update paths
- Background or startup auto-check
- Changelog / release notes screen
- Private GitHub auth / tokens
- OTA (`expo-updates`) as substitute for APK releases
