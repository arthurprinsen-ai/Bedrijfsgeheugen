# P0 #4198 — LinkedIn provider payload length fence (2026-10-10)

- **Incident:** An oversized personal LinkedIn commentary was rejected by Composio/LinkedIn after the channel's once-a-day publication capability was consumed.
- **Fix:** Compact generated LinkedIn copy at safe paragraph/sentence boundaries (max 2,800 characters), then hash and review exact final copy. Refuse any 3,000+ character payload before claiming dispatch or issuing a publication authority.
- **Safety:** This patch does not revoke historical consumed authority or bypass account OAuth, exact post identity, semantic duplicate rules or provider readback. Historical retry requires independent rejection/no-side-effect evidence.
- **Verification:** tests/brain-linkedin-length-preflight-p0-4198.test.mjs, protected CI, production Edge parity, followed by real provider ID/readback.
