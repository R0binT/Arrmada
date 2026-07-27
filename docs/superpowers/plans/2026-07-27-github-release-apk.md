# GitHub Release + APK Workflows Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add prepare-release (manual version/PR) and publish-release (merge → APK + GitHub Release); remove the old draft APK workflow.

**Architecture:** Two GitHub Actions workflows. Prepare bumps version files on `release/vX.Y.Z` and opens a PR. Publish runs only when a `release/v*` PR merges to `master`, builds via Expo prebuild + Gradle, and attaches the APK to a published release.

**Tech Stack:** GitHub Actions, `gh` CLI, Node 20, JDK 17, Expo prebuild, Gradle `assembleRelease`

## Global Constraints

- Patch bump from latest GitHub release tag when version input empty
- Version files: `package.json`, `app.json` (`expo.version` + `android.versionCode` +1)
- No direct commits to `master` from prepare
- Published (non-draft) release only after merge
- Do not call the product “MVP”

## File map

| File | Role |
|------|------|
| `.github/workflows/prepare-release.yml` | Create | Manual prepare + PR |
| `.github/workflows/publish-release.yml` | Create | Merge → build + release |
| `.github/workflows/build-and-release-apk.yml` | Delete | Replaced |
| `docs/superpowers/specs/2026-07-27-github-release-apk-design.md` | Keep | Spec |
| `docs/superpowers/plans/2026-07-27-github-release-apk.md` | Keep | This plan |

---

### Task 1: Prepare release workflow

**Files:**
- Create: `.github/workflows/prepare-release.yml`

- [ ] **Step 1:** Add workflow with `workflow_dispatch` input `version` (optional), permissions `contents: write` + `pull-requests: write`, checkout `master`, setup Node if needed for jq/semver via bash only.

- [ ] **Step 2:** Resolve version — if input set, validate `^[0-9]+\.[0-9]+\.[0-9]+$`; else `gh release view` / `gh release list --limit 1` for latest tag, strip `v`, bump patch; fail if no release.

- [ ] **Step 3:** Create branch `release/v$VERSION`, bump `package.json` version, `app.json` expo.version and versionCode+1 (node one-liner or python), commit, push, `gh pr create`.

- [ ] **Step 4:** Commit on feature branch.

### Task 2: Publish release workflow

**Files:**
- Create: `.github/workflows/publish-release.yml`
- Delete: `.github/workflows/build-and-release-apk.yml`

- [ ] **Step 1:** Trigger `pull_request` types `[closed]`, job `if: github.event.pull_request.merged && startsWith(github.event.pull_request.head.ref, 'release/v')`.

- [ ] **Step 2:** Parse version from head ref; build APK (Node 20, JDK 17, npm ci, expo prebuild, assembleRelease); name `Arrmada-$VERSION.apk`.

- [ ] **Step 3:** `gh release create "v$VERSION" --title "Arrmada $VERSION" --generate-notes` (or plain create) then upload APK; if release exists, upload with `--clobber`.

- [ ] **Step 4:** Delete old workflow; commit.

### Task 3: Docs + verify

- [ ] Ensure design spec is on the branch
- [ ] Push branch; open PR to master with required body sections
