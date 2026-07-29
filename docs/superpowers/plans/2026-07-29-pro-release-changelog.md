# Pro Release Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Professional English CHANGELOG + GitHub Release notes via release-please, label-gated release PRs, commitlint, APK publish on GitHub Release, and historical backfill.

**Architecture:** Replace Prepare-release (`release/v*`) with release-please. Trigger release-please when a PR labeled `release` merges to `master` (or `workflow_dispatch`). On merge of the release-please PR, GitHub Release is created; Publish APK listens to `release: published` and attaches the APK. commitlint blocks non-conventional subjects.

**Tech Stack:** `googleapis/release-please-action@v4`, `@commitlint/cli` + `@commitlint/config-conventional`, existing Expo/Gradle publish workflow, `gh` for backfill.

## Global Constraints

- English Keep a Changelog + GitHub notes only
- Label name: `release`
- Semver: conventional (`fix`→patch, `feat`→minor, breaking→major) + manual `release-as` override
- Do not change Gradle/Expo APK compile steps beyond trigger rewiring
- Spec: `docs/superpowers/specs/2026-07-29-pro-release-changelog-design.md`

## File map

| File | Role |
|------|------|
| `commitlint.config.cjs` | Conventional commit rules |
| `.githooks/commit-msg` | Local commitlint |
| `package.json` | commitlint deps + script |
| `release-please-config.json` | Node package + extra-files (`app.json` version) |
| `.release-please-manifest.json` | Current version `1.1.5` at `.` |
| `.github/workflows/release-please.yml` | Label-merge + dispatch triggers |
| `.github/workflows/publish-release.yml` | Trigger on `release: published` |
| `.github/workflows/prepare-release.yml` | Delete (replaced) |
| `.github/workflows/ci.yml` | Add commitlint job on PRs |
| `scripts/bump-android-version-code.mjs` | Increment `app.json` versionCode on release PR |
| `scripts/backfill-changelog.mjs` | Build historical CHANGELOG + print notes |
| `CHANGELOG.md` | Generated / backfilled |
| `docs/maintainers/releases.md` | How to ship (optional short) |

---

### Task 1: commitlint (local + CI)

**Files:**
- Create: `commitlint.config.cjs`
- Create: `.githooks/commit-msg`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1:** Add devDependencies and script

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

Add script: `"commitlint": "commitlint --edit"`

- [ ] **Step 2:** Create `commitlint.config.cjs`

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
  },
};
```

- [ ] **Step 3:** Create `.githooks/commit-msg`

```sh
#!/usr/bin/env sh
if [ "$SKIP_GIT_HOOKS" = "1" ]; then
  exit 0
fi
npx --no -- commitlint --edit "$1"
```

Make executable (Unix); Windows uses the same hooksPath.

- [ ] **Step 4:** Add CI job `commitlint` on PRs (fetch enough history):

```yaml
commitlint:
  name: commitlint
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v7
      with:
        fetch-depth: 0
    - uses: actions/setup-node@v7
      with:
        node-version-file: ".nvmrc"
        cache: npm
    - run: npm ci --no-audit --no-fund
    - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
```

Wire into `ci-gate` as required alongside existing checks when present.

- [ ] **Step 5:** Commit `chore: add commitlint for conventional commits`

---

### Task 2: release-please config + workflow

**Files:**
- Create: `release-please-config.json`
- Create: `.release-please-manifest.json`
- Create: `.github/workflows/release-please.yml`
- Create: `scripts/bump-android-version-code.mjs`

- [ ] **Step 1:** `release-please-config.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-path": "CHANGELOG.md",
      "include-v-in-tag": true,
      "extra-files": [
        {
          "type": "json",
          "path": "app.json",
          "jsonpath": "$.expo.version"
        }
      ]
    }
  },
  "changelog-sections": [
    { "type": "feat", "section": "Added" },
    { "type": "fix", "section": "Fixed" },
    { "type": "perf", "section": "Changed" },
    { "type": "refactor", "section": "Changed" },
    { "type": "docs", "section": "Maintenance" },
    { "type": "ci", "section": "Maintenance" },
    { "type": "chore", "section": "Maintenance", "hidden": false },
    { "type": "test", "section": "Maintenance" }
  ]
}
```

- [ ] **Step 2:** `.release-please-manifest.json` → `{ ".": "1.1.5" }`

- [ ] **Step 3:** Workflow triggers — **not** on every push:

```yaml
on:
  pull_request:
    types: [closed]
    branches: [master]
  workflow_dispatch:
    inputs:
      version:
        description: "Optional semver override (e.g. 1.2.0)"
        required: false
        type: string
```

Job condition for PR event:

```yaml
if: >
  github.event_name == 'workflow_dispatch' ||
  (github.event.pull_request.merged == true &&
   contains(join(github.event.pull_request.labels.*.name, ','), 'release'))
```

Permissions: `contents: write`, `pull-requests: write`.

Use `googleapis/release-please-action@v4` with manifest (no `release-type` input), pass `release-as: ${{ inputs.version }}` when dispatch provides version.

- [ ] **Step 4:** After release-please, if a release PR exists/updated, run `scripts/bump-android-version-code.mjs` on that branch (checkout PR head, increment `expo.android.versionCode`, commit `chore: bump android versionCode`, push). Skip if already bumped for that version.

- [ ] **Step 5:** Ensure GitHub label `release` exists (document `gh label create release --description "Merge opens/updates release-please PR" --color BFD4F2` in maintainers doc).

- [ ] **Step 6:** Commit `feat(ci): add release-please with label-gated trigger`

---

### Task 3: Retarget Publish APK + remove Prepare release

**Files:**
- Modify: `.github/workflows/publish-release.yml`
- Delete: `.github/workflows/prepare-release.yml`

- [ ] **Step 1:** Change `on:` to:

```yaml
on:
  release:
    types: [published]
```

- [ ] **Step 2:** Resolve version from `github.event.release.tag_name` (strip `v`), verify `package.json` matches.

- [ ] **Step 3:** Keep SDK/Gradle/APK steps; upload with `gh release upload "${TAG}" ... --clobber` using `github.event.release.tag_name`.

- [ ] **Step 4:** Delete `prepare-release.yml`.

- [ ] **Step 5:** Commit `ci: publish APK on GitHub Release; remove Prepare release`

---

### Task 4: Historical CHANGELOG backfill + rewrite GitHub release notes

**Files:**
- Create: `scripts/backfill-changelog.mjs`
- Create: `CHANGELOG.md`

- [ ] **Step 1:** Script lists tags `v1.0.0`…`v1.1.5`, for each range collects merged PR titles via `gh`/`git log`, categorizes by conventional prefix, writes Keep a Changelog file + compare links.

- [ ] **Step 2:** Run script; commit `CHANGELOG.md`.

- [ ] **Step 3:** For each tag, `gh release edit TAG --notes-file ...` with that section’s body (plus APK mention if desired). Requires network/`gh` auth — do in agent with permissions.

- [ ] **Step 4:** Commit any script fixes `chore: backfill CHANGELOG and release notes helpers`

---

### Task 5: Maintainer docs + PR

**Files:**
- Create: `docs/maintainers/releases.md`

- [ ] Document: label `release` flow, dispatch override, commitlint, APK attachment.
- [ ] Open PR to master with full summary/test plan.

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| CHANGELOG + GitHub notes EN | 2, 4 |
| Backfill v1.0.0–v1.1.5 | 4 |
| commitlint blocking | 1 |
| release-please | 2 |
| Label `release` → open release PR | 2 |
| Manual version override | 2 (`workflow_dispatch` / release-as) |
| APK on release published | 3 |
| Remove Prepare release | 3 |
| versionCode bump | 2 (script) |
