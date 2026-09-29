# 2026-09-29 — Instagram provider ID drift v3

Production incident: publication-ready Mira Reel failed provider identity preflight because a historical numeric Instagram ID was hardcoded.

Fix: live identity discovery and same-providerUserId binding across create/publish/readback; skill, agents, chats, Brain and System Map updated.

## Terminal production evidence
- Provider post ID: `18105956765257858`
- Canonical username: `bedrijfsgeheugen.nl`
- Live Business user ID: `28537384955950341`
- Permalink: `https://www.instagram.com/reel/Dd4MOdTEarq/`
- Published at: `2026-09-29T16:29:48Z`
- Provider readback: PASS
- Powerhouse obligation: PUBLISHED
- Media job: LIVE_PROVEN
- Duplicate/replacement: forbidden
