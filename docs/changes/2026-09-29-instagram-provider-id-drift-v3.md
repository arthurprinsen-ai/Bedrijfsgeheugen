# Instagram provider identity drift v3 — 29 september 2026

De publisher gebruikte een historische numerieke Instagram provider-ID. De actieve canonieke verbinding bewijst `bedrijfsgeheugen.nl`, BUSINESS, current provider user ID `28537384955950341`.

Structureel: live `INSTAGRAM_GET_USER_INFO(me)` vóór iedere provider-write; eis juiste username + BUSINESS/CREATOR; bind create → publish → readback aan dezelfde live providerUserId; hervat dezelfde daily claim bij drift.

## Live productie-evidence
- @bedrijfsgeheugen.nl provider-readback: BUSINESS, user ID `28537384955950341`.
- Gepubliceerde Reel media-ID: `18105956765257858`.
- Permalink: `https://www.instagram.com/reel/Dd4MOdTEarq/`.
- Provider timestamp: `2026-09-29T16:29:48Z`.
- Caption, username, REELS/VIDEO en permalink zijn onafhankelijk teruggelezen via `INSTAGRAM_GET_IG_MEDIA`.
- Powerhouse states: decision `published`, obligation `PUBLISHED`, media-job `LIVE_PROVEN`, `republish_forbidden=true`.
