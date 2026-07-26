# GitHub Pages hero support copy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the technical hero support blurb with everyday-use copy on the GitHub Pages site and README.

**Architecture:** Pure copy edit. Tagline and surrounding UI stay unchanged. Same English sentence in `docs/index.html` and `README.md`.

**Tech Stack:** Static HTML (GitHub Pages), Markdown README.

## Global Constraints

- Final support sentence (verbatim): `Browse movies and series, add what you want, follow upcoming releases, and manage downloads — all from your phone at home.`
- Do not change the tagline, CTAs, features section, meta/OG, or CSS.
- README: update only the support sentence; keep the UI-language sentence.
- Do not introduce Expo, Android-first, “talking directly”, or one-Radarr/one-Sonarr wording in this sentence.

## File map

| File | Role |
| --- | --- |
| `docs/index.html` | GitHub Pages hero `.support` paragraph |
| `README.md` | Repo intro support sentence (same wording) |

---

### Task 1: Update GitHub Pages hero support copy

**Files:**
- Modify: `docs/index.html` (`.support` paragraph under the tagline)
- Verify: ripgrep for old and new strings

**Interfaces:**
- Consumes: approved copy from `docs/superpowers/specs/2026-07-26-github-pages-hero-support-copy-design.md`
- Produces: hero `.support` text matching the Global Constraints sentence

- [ ] **Step 1: Confirm current technical copy is present**

Run:

```bash
rg -n "Android-first Expo app for a non-technical home user" docs/index.html
```

Expected: one match in the `.support` block.

- [ ] **Step 2: Replace the `.support` paragraph**

Replace:

```html
          <p class="support">
            Android-first Expo app for a non-technical home user. Browse Movies
            and Series, add titles, follow releases, and control Downloads —
            talking <em>directly</em> to one Radarr and one Sonarr on your
            Wi‑Fi.
          </p>
```

with:

```html
          <p class="support">
            Browse movies and series, add what you want, follow upcoming
            releases, and manage downloads — all from your phone at home.
          </p>
```

- [ ] **Step 3: Verify old jargon is gone and new copy is present**

Run:

```bash
rg -n "Android-first Expo|talking|Browse movies and series, add what you want" docs/index.html
```

Expected: no matches for `Android-first Expo` or `talking`; one match for the new sentence start.

- [ ] **Step 4: Commit (only if the user asked to commit)**

```bash
git add docs/index.html
git commit -m "docs: soften GitHub Pages hero support copy"
```

---

### Task 2: Sync README support sentence

**Files:**
- Modify: `README.md` (centered intro paragraph support sentence only)
- Verify: ripgrep for old and new strings; keep language-preference sentence

**Interfaces:**
- Consumes: same final sentence as Task 1
- Produces: README support sentence aligned with GitHub Pages

- [ ] **Step 1: Confirm current technical copy is present**

Run:

```bash
rg -n "Android-first Expo app for a non-technical home user" README.md
```

Expected: one match in the intro blurb.

- [ ] **Step 2: Replace the support sentence; keep language note**

Replace the support portion so the intro becomes:

```markdown
<p align="center">
  Browse movies and series, add what you want, follow upcoming releases,
  and manage downloads — all from your phone at home.
  UI language follows the phone (<code>fr*</code> → French, otherwise English),
  with an override in Settings → Preferences.
</p>
```

- [ ] **Step 3: Verify**

Run:

```bash
rg -n "Android-first Expo|all from your phone at home|UI language follows the phone" README.md
```

Expected: no `Android-first Expo`; both the new support sentence and the UI-language sentence present.

- [ ] **Step 4: Commit (only if the user asked to commit)**

```bash
git add README.md
git commit -m "docs: align README intro with softer hero copy"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| Final support copy on GitHub Pages | Task 1 |
| README support sentence sync; language sentence kept | Task 2 |
| Tagline / layout / meta out of scope | Not modified |
| No new technical terms in that sentence | Verified in Steps 3 |
