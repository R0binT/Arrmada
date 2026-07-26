# Maintainer notes

## Two repositories

| Repo | Role |
| ---- | ---- |
| **[R0binT/Arrmada](https://github.com/R0binT/Arrmada)** | Public OSS app — clean docs, fork → PR workflow, releases |
| **[R0binT/ARRapp](https://github.com/R0binT/ARRapp)** | Personal parallel history — agent workflows, specs, product context |

Both codebases share the same app (Radarr + Sonarr client for home LAN). The public **Arrmada** repo is the name users and contributors see; **ARRapp** remains the maintainer’s private development home.

## What lives where

**Arrmada (public export)**

- `README.md`, `CONTRIBUTING.md`, `docs/decisions/` (ADRs)
- Minimal agent/CI docs under `docs/agents/` when useful for contributors

**ARRapp (personal repo only)**

- Root `CONTEXT.md`, `AGENTS.md`, `CLAUDE.md`
- `docs/superpowers/` (design specs, implementation plans, mockups)
- Issue-tracker and triage docs that reference `R0binT/ARRapp`

When exporting a release to Arrmada, strip or rewrite personal-repo links and keep agent-heavy material in ARRapp.

## Package identity

- Display name: **Arrmada**
- npm package name: `arrmada`
- Android package: `com.arrmada.mobile`
- URL scheme: `arrmada`

Storage keys (`arr.*`, `ui.*`, etc.) are unchanged across rebrand so existing installs keep settings.
