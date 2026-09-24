# 2026-09-24 — Branche-integraties production recovery

Fingerprint: `branche-integrations-production-recovery-v1`

## Verandering
- branch integration delivery paths geclassificeerd;
- branche-integratie regressietest aan website CI gekoppeld;
- Portal top-level navigatiecontract hersteld;
- production snapshot 401 als credential-blocker geregistreerd.

## Evidence
- feature PR #2714;
- classifier recovery PR #2716;
- production snapshot trigger PR #2717;
- Production Source Snapshot run 35991169738 faalde op `401 Unauthorized` van de Netlify MCP proxy.

## Terminale regel
Niet LIVE_BEWEZEN totdat Netlify exact de nieuwe protected-main SHA terugleest.
