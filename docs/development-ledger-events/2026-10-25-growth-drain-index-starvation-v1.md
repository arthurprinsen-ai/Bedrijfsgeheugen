# Growth-drain durable event index — 25 October 2026

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4446
- Commercial: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Obligation-ID: netlify|growth-drain|durable-pending-fast-lane|20261025-v1
- Production evidence: HTTP204, replayed=0, persisted=0, 72-141 archived receipts scanned, budgetExpired=true.
- Correction: indexed pending prefix inside existing minute job, source receipts retained and optional BG211 disabled unless independently authorized.
- Focused regression: node --test tests/brain-growth-drain-time-budget-v1.test.mjs
- Terminal: no live claim without merge + deploy + fresh independent DataHub event. No sales or revenue inference.
