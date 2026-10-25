# Development ledger — Omgevingsradar source-to-action

- Date: 2026-10-25
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
- Commercial P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Obligation-ID: portal:relevance-source-to-tenant-action:20261025-v1
- Owner: portal, existing specialist module; no conflicting publisher or new scheduler
- Source file: portal-v2/modules/entrepreneur-intelligence.js
- Regression: tests/brain-portal-relevance-next-action-source-20261025.test.mjs
- Evidence: missing signal-specific next action, inert `data-open-page` links, unverified candidate-vs-action provenance
- Gate: Required + CodeQL + protected merge + Netlify production readback + tenant-auth action navigation
- Status: CODE_CANDIDATE — no provider side effect, order or revenue claimed
