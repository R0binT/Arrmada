# Refresh README & GitHub Pages screenshots — Design

Date: 2026-07-29  
Status: Approved (conversation)  
Branch: `chore/refresh-screenshots-gallery`

## Goal

Refresh marketing screenshots (English UI) and polish README + GitHub Pages gallery to include **series** and **detail/MediaQuick**, as an 8-shot set.

## Shot list

| File | Screen |
|------|--------|
| `docs/screenshots/01-home.png` | Home |
| `docs/screenshots/02-movies.png` | Movies library |
| `docs/screenshots/03-series.png` | Series library (new) |
| `docs/screenshots/04-upcoming.png` | Upcoming (was 03) |
| `docs/screenshots/05-settings.png` | Settings (was 04) |
| `docs/screenshots/06-movie-detail.png` | Movie detail |
| `docs/screenshots/07-series-detail.png` | Series detail |
| `docs/screenshots/08-mediaquick.png` | MediaQuick sheet |

Capture: Android emulator, `adb exec-out screencap -p`, target ~1080×2400.

## Doc updates

- README gallery → 8 images + captions; Features mention audio/ST languages and episode detail lightly.
- `docs/index.html` gallery → same 8; hero keeps Home; footer PolyForm Noncommercial (fix MIT).
- CSS: wrap/scroll for more figures without breaking layout.

## Out of scope

Episode detail, Downloads, Add screenshots.
