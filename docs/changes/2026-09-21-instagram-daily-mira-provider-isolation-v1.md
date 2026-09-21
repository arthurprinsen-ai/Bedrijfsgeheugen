# Daily Mira Instagram delivery — provider isolation and retry stability

Date: 21 September 2026  
Fingerprint: `instagram-daily-mira-provider-isolation-v1`

The failure was not one single posting bug. The daily chain had four interacting issues:

1. Buffer was under a provider-wide 24-hour 429 rate limit.
2. The autonomous Powerhouse runtime did not have a valid Composio Instagram credential.
3. Instagram posts created by another provider could still be inspected as if their external IDs belonged to Buffer.
4. The media router counted the same unresolved replacement state as a fresh attempt on every preflight, creating a retry storm.

The repair makes provider ownership explicit, stops Buffer calls while its canonical circuit is open, freezes attempt growth for an unchanged blocker, and reuses the exact proven Mira Reel across recovery. Composio is still the primary Instagram transport. Buffer may act only as a bounded secondary transport after its rate-limit circuit closes, and only through the same canonical publisher and Mira Reel-only safety gates.

The following remain forbidden: non-Mira Instagram content, image fallback, generic Bedrijfsgeheugen creative, second-winner generation to escape a blocker, duplicate publication, unproven provider state, and Make.

The system must not mark the incident terminal merely because code is committed or deployed. Terminal success requires exact-head CI, protected merge, runtime/source readback and provider delivery evidence.
