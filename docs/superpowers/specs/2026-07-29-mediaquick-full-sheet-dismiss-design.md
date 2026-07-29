# MediaQuick: dismiss by dragging anywhere — Design

Date: 2026-07-29  
Status: Approved (conversation)

## Goal

Allow closing MediaQuick by dragging down from anywhere on the sheet, not only from the top handle.

## Context

`PanResponder` is currently attached only to the drag-handle `View` in `MediaQuickSheet`. The panel content is wrapped in a `ScrollView`, but MediaQuick content is not expected to scroll in normal use.

## Decision

- Move dismiss pan handlers to the whole sheet container.
- Claim the gesture on **move** only (`onStartShouldSetPanResponder: false`) so taps on buttons still work.
- Capture downward-dominant moves so the sheet wins over the inner `ScrollView`.
- Keep existing dismiss thresholds / spring-back / reduce-motion behavior.
- Keep the visible handle for affordance + accessibility labels.

## Out of scope

- Reworking MediaQuick layout or removing `ScrollView`
- Migrating to `react-native-gesture-handler`
- Changing scrim tap / back-button dismiss
