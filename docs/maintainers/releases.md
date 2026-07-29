# Releases

## Ship a new version

1. Land feature/fix PRs on `master` with **conventional commit** subjects (`feat:`, `fix:`, …). Local `commit-msg` hook and CI **commitlint** enforce this.
2. Open a PR that includes everything you want in the next release (or use an empty/docs PR), add the **`release`** label, and merge it into `master`.
3. The **Release please** workflow opens or updates a release PR (version bump, `CHANGELOG.md`, `app.json` version, Android `versionCode`).
4. Review and merge that release PR.
5. release-please creates the GitHub Release + tag; **Publish release** builds `Arrmada-{VERSION}.apk` and uploads it.

## Manual version override

Run **Actions → Release please → Run workflow** and set `version` (e.g. `1.2.0`) to force that semver on the next release PR.

## Without the `release` label

Merges to `master` do **not** open a release PR. Commits accumulate until a labeled merge or a manual workflow dispatch.

## Local hooks

`prepare` sets `core.hooksPath` to `.githooks` (`pre-commit` typecheck, `commit-msg` commitlint). Skip with `SKIP_GIT_HOOKS=1`.
