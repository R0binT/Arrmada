# Fix onboarding connection validation — Design

Date: 2026-07-30  
Status: Approved (conversation)  
Branch: `fix/onboarding-connection-validation`

## Goal

Fix onboarding (and Settings → Services) so placeholders show the correct Arr ports, and “Test connection” fails when the remote app is not the expected Radarr/Sonarr instance.

## Changes

1. URL placeholder: Radarr `http://192.168.1.10:7878`, Sonarr `http://192.168.1.10:8989`.
2. `mapHealth`: require `appName` (fallback `instanceName`) to match expected service; else `online: false` + localized message.
3. Unit tests for match / mismatch / missing version.
4. Apply to shared card used by onboarding and settings.

## Out of scope

Forced re-test before Continue/Save (optional follow-up).
