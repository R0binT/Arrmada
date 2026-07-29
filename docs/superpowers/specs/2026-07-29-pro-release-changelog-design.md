# Pro release changelog & release-please — Design

Date: 2026-07-29  
Status: Approved (conversation)

## Goal

Make Arrmada releases look professional: English Keep a Changelog + polished GitHub Release notes, conventional commits with blocking lint, semver from commit types (with manual override), and an explicit **label-gated** path to open a release PR. Keep APK build/upload after the GitHub Release exists.

## Decisions

| Topic | Choice |
|--------|--------|
| Notes language | English only |
| Artifacts | `CHANGELOG.md` **and** GitHub Release bodies |
| Historical backfill | Full `v1.0.0` … `v1.1.5` in CHANGELOG + rewrite existing GitHub release notes |
| Commit style | Conventional commits + **blocking** commitlint (CI + git hook) |
| Release automation | **release-please** (not Changesets) |
| Semver | Auto from commits (`fix`→patch, `feat`→minor, `BREAKING CHANGE` / `!`→major) + **manual override** |
| APK | Unchanged build pipeline; trigger on GitHub Release published (or equivalent tag), attach `Arrmada-{VERSION}.apk` |
| Label gate | Label on a PR to `master` → on merge, **open/update** the release-please PR (human merges that PR to publish) |

## Label behavior

- Label name: `release` (create as a repo label if missing).
- When a PR **with** `release` is **merged** into `master`:
  1. Run release-please against `master`.
  2. It opens or updates the usual release-please PR (version bump, `CHANGELOG.md`, app version files).
  3. Maintainer reviews and merges that release PR → tag + GitHub Release notes.
  4. Publish-APK workflow runs and attaches the APK.
- Merges **without** the label do **not** trigger release-please (commits accumulate on `master` until a labeled merge or a manual dispatch).
- Manual path: `workflow_dispatch` on the release-please workflow (optional `version` / release-as override) to open/update the release PR without a labeled feature PR.

## Semver & version files

- release-please owns `package.json` version and `CHANGELOG.md`.
- Also bump `app.json` `expo.version` and increment `expo.android.versionCode` on each release (extra-files / custom changelog plugin or a small post-bump script in the release PR pipeline).
- Manual override: `workflow_dispatch` input `version` (semver without `v`) mapped to release-please `Release-As`, or a commit footer `Release-As: x.y.z`.

## Note categorization

Derived from conventional prefixes (PR title / commit subject):

| Prefix | Section |
|--------|---------|
| `feat` | Added |
| `fix` | Fixed |
| `perf`, `refactor` | Changed |
| `docs`, `ci`, `chore`, `test` | Maintenance |
| `release:` / release-please bot noise | Excluded or collapsed |

Empty sections omitted. Entries include PR number links when available.

## Workflow map (target)

1. **commitlint** — `commit-msg` hook via existing `.githooks` + CI check on PRs (fail if subject not conventional).
2. **release-please** — triggered by:
   - `pull_request` closed (merged) to `master` **and** label `release` present on the merged PR;
   - and/or `workflow_dispatch` (with optional version override).
3. **Remove / replace** current **Prepare release** workflow (patch bump + `release/v*` branch) once release-please path is live.
4. **Publish APK** — retarget from “merge of `release/v*` PR” to **`release: published`** (or push of `v*` tag created by release-please); upload APK to that release; keep Gradle/Expo build steps as they are (including gradle.properties newline fix).

## Backfill (this initiative)

1. Generate historical `CHANGELOG.md` for all tags `v1.0.0` … `v1.1.5` from merged PRs/commits between tags (same categorization rules).
2. `gh release edit` each existing release body to match the corresponding changelog section (professional notes, not raw `--generate-notes` dumps).

## Out of scope

- Changesets
- French release notes
- Changing how the APK is compiled (SDK/Gradle flags beyond existing publish workflow)
- Auto-merging the release-please PR (label path is review-then-merge only)

## Success criteria

- Merging a `release`-labeled PR opens/updates a release-please PR with sensible CHANGELOG + version bumps.
- Merging the release-please PR publishes a GitHub Release with curated English notes and then attaches `Arrmada-{VERSION}.apk`.
- commitlint blocks non-conventional commit subjects in CI (and local hook).
- All past releases have matching CHANGELOG sections and updated GitHub release bodies.
- Manual `workflow_dispatch` can force a version and/or open a release PR without a labeled PR.
