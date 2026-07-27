# GitHub Release + APK — Design

Date: 2026-07-27  
Status: Approved (conversation); awaiting spec file review

## Goal

Replace the current one-shot draft APK workflow with a two-step release flow:

1. **Prepare** — manual dispatch chooses or auto-bumps a semver, opens a dedicated release branch + PR.
2. **Publish** — after that PR merges to `master`, build the Android APK and attach it to a new published GitHub Release.

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Version source when input empty | Latest GitHub release/tag → **patch +1** |
| Version files | Update `package.json`, `app.json` (`expo.version`), `android.versionCode` (+1) |
| Land version bump | Via branch `release/vX.Y.Z` + PR into `master` (no direct push to `master`) |
| When to build/publish | **After** the release PR is merged |
| Release type | Published GitHub Release (not draft) |
| Build method | Keep local Expo prebuild + Gradle `assembleRelease` (same as today) |

## Workflow A — `prepare-release.yml`

**Trigger:** `workflow_dispatch`  
**Input:** `version` (optional string, e.g. `1.0.2` — no leading `v`)

### Resolve version

1. If `version` is non-empty: validate `MAJOR.MINOR.PATCH`, use as-is.
2. Else:
   - Resolve latest release tag via `gh release list` / `gh api` (prefer latest non-draft release; fall back to newest `v*` tag).
   - Strip leading `v`, bump **patch** only (`1.0.1` → `1.0.2`).
   - If no prior tag/release: **fail** with a clear message (do not invent a baseline).

### Git / PR

1. Checkout `master` (latest).
2. Create branch `release/v{VERSION}`.
3. Bump:
   - `package.json` → `"version": "{VERSION}"`
   - `app.json` → `expo.version` → `{VERSION}`
   - `app.json` → `expo.android.versionCode` → current + 1
4. Commit message: `release: v{VERSION}`
5. Push branch and open PR to `master` with:
   - Title: `release: v{VERSION}`
   - Body: short summary + note that merge will trigger APK publish
6. Do **not** create the GitHub Release or build the APK in this workflow.

**Permissions:** `contents: write`, `pull-requests: write`

## Workflow B — `publish-release.yml`

**Trigger:** `pull_request` with `types: [closed]`  
**Guard:** `github.event.pull_request.merged == true` **and** head ref matches `release/v*`

### Resolve version

- Parse from head branch name: `release/v1.0.2` → `1.0.2`, or from `package.json` on the merge commit (branch name preferred for consistency).

### Build

Same pipeline as today’s `build-and-release-apk.yml`:

1. Checkout the merge commit on `master` (default for `pull_request` closed).
2. Setup Node 20 + JDK 17.
3. `npm ci`
4. `npx expo prebuild --platform android --clean`
5. `./android/gradlew assembleRelease`
6. Locate release APK; copy to `Arrmada-{VERSION}.apk`

### Publish

1. Create GitHub Release `v{VERSION}` (title `Arrmada {VERSION}`), **published** (not draft).
2. Upload `Arrmada-{VERSION}.apk` with `gh release upload` (`--clobber` if re-run).
3. If the release/tag already exists, upload/replace the APK asset rather than failing hard when possible.

**Permissions:** `contents: write`

## Migration of existing workflow

- Remove or replace `.github/workflows/build-and-release-apk.yml` so there is a single clear path:
  - Prepare = new `prepare-release.yml`
  - Publish = new `publish-release.yml`
- Do not keep the old “optional version → package.json, create draft, upload” behaviour.

## Operator flow

1. Actions → **Prepare release** → Run workflow (leave version empty for patch, or set e.g. `1.1.0`).
2. Review/merge the `release: vX.Y.Z` PR.
3. Wait for **Publish release** workflow; APK appears on the GitHub Release `vX.Y.Z`.

## Out of scope

- iOS / TestFlight
- EAS Build cloud
- Custom signing keystore secrets beyond current Gradle release setup
- Auto-generated changelog from commits (optional later)
- Major/minor bump helpers in the UI (manual version input covers that)

## Failure modes

| Case | Behaviour |
|------|-----------|
| Invalid version input | Fail prepare job early |
| `release/vX.Y.Z` already exists | Fail prepare with clear message |
| Open release PR already exists for same version | Fail or no-op with message |
| Publish triggered by non-release PR | Job skipped (`if:` guard) |
| APK not found after Gradle | Fail publish |
| Duplicate tag on publish | Prefer upload to existing release / clear error |

## Success criteria

- Empty version input yields next patch from latest GitHub release tag.
- Version bumps land only via `release/v*` PR.
- Merging that PR publishes a non-draft release with an attached APK named `Arrmada-{VERSION}.apk`.
- Old draft-centric workflow is gone.
