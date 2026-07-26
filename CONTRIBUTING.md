# Contributing to Arrmada

Thank you for your interest in Arrmada.

## How to contribute

1. **Fork** [R0binT/Arrmada](https://github.com/R0binT/Arrmada) on GitHub.
2. **Clone** your fork locally.
3. **Branch** from `master` (e.g. `fix/short-description` or `feat/short-description`).
4. Make your changes, run `npm run lint`, `npm run typecheck`, and `npm test`, and commit with a clear message.
5. **Open a pull request** against `master` on the upstream repo.

## Pull request CI

CI is path-aware on pull requests to `master`:

- **App / lockfile / Jest / ESLint / Expo config** (`app/`, `src/`, `assets/`, `package.json`, …) or **workflow** changes (`.github/workflows/`) → runs lint, typecheck, tests, and `expo-doctor`.
- **Docs-only** (Markdown, `docs/`, …) → skips those code jobs.

The required branch-protection check is **`ci-gate`**. It always runs: green when code jobs succeed or are skipped (docs-only), red if any code job fails. After renaming this check, update GitHub branch protection so `ci-gate` is required (replace the old `typecheck + test` name if still listed).

## Merge policy

Only the repository owner merges pull requests. Please do not push directly to `master`.

## Questions

Open a GitHub issue for bugs, feature ideas, or questions before large changes.
