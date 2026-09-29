# Instagram provider identity drift v3 — 29 september 2026

## Incident
De bewezen Mira Reel kwam door alle media-, identity- en continuity-gates maar de Composio provider-preflight faalde op `INSTAGRAM_GET_USER_INFO`.

## Root cause
De social publisher gebruikte nog een historische numerieke Instagram Business/Graph User ID. De actieve canonieke verbinding rapporteert nu:

- username: `bedrijfsgeheugen.nl`
- account type: `BUSINESS`
- current provider user ID: `28537384955950341`

## Structurele fix
De numerieke provider-ID is niet langer authority. De publisher leest vóór iedere Instagram provider-write `INSTAGRAM_GET_USER_INFO(me)` op de geselecteerde actieve verbinding, eist `bedrijfsgeheugen.nl` + BUSINESS/CREATOR en gebruikt vervolgens exact de live `providerUserId` voor create → publish → readback.

De daily claim blijft idempotent en wordt bij identity drift hervat; er wordt geen replacement post gemaakt.
