# 2026-11-18 — Original Mira media job self-heal / provider verification

- Original P0: #5232, combined system P0 #4198
- Existing job: `4a68dc41-6e60-4b64-ba7b-400086cb7296`
- One original OpenArt history: `r6sZX8kdGyvpD6zEbWg7`
- Frozen winner and source: `ab10709a-bad8-4ad4-9305-1b7c0cc83c44`; canonical PH-P010
- Verified production failures: original #34812 face-mismatch wrapper (underlying provider 429); subsequent #34828 HTTP503 provider unavailable after classifier fixed
- True state: original job VERIFYING, no 0.940 face scores, no Meta provider ID
- Root cause: read-only preflight did not advance already-generated OpenArt output after verifier outage; original producer could stall forever
- Repair: original-only, CAS same-row bounded retry in existing router, single video immutable source, 30/60/120 min delays, max 3, crash recovery, no provider post or new generation
- Evidence: `tests/brain-mira-original-exact-video-provider-retry.test.mjs` plus parent original output/incident receipts
- State: CODE_CANDIDATE; no actual successful identity/Meta/HeartBeat proof; do not green
