# Releases

## Ship a new version

1. Land feature/fix PRs on `master` with **conventional commit** subjects (`feat:`, `fix:`, …). Local `commit-msg` hook and CI **commitlint** enforce this.
2. Open a PR that includes everything you want in the next release (or use an empty/docs PR), add the **`release`** label, and merge it into `master`.
3. The **Release please** workflow opens or updates a release PR (version bump, `CHANGELOG.md`, `app.json` version, Android `versionCode`).
4. Review and merge that release PR.
5. release-please creates the GitHub Release + tag (`vX.Y.Z`); the same workflow then runs **Publish release** and uploads `Arrmada-{VERSION}.apk`.

> Note: Releases created with `GITHUB_TOKEN` do not trigger other workflows' `on: release` hooks. Publish is therefore invoked via `workflow_call` from **Release please** when `release_created` is true. You can also run **Actions → Publish release → Run workflow** with a tag for recovery.

## Manual version override

Run **Actions → Release please → Run workflow** and set `version` (e.g. `1.2.0`) to force that semver on the next release PR.

## Without the `release` label

Merges to `master` do **not** open a release PR. Commits accumulate until a labeled merge or a manual workflow dispatch. Merging an existing `release-please--*` PR still creates the GitHub Release.

## Local hooks

`prepare` sets `core.hooksPath` to `.githooks` (`pre-commit` typecheck, `commit-msg` commitlint). Skip with `SKIP_GIT_HOOKS=1`.
