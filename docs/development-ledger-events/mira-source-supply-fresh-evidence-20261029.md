# Canonical Mira source-supply repair — public engineering event

- Date: 2026-10-29.
- Existing owner: `powerhouse-mira-problem-radar`, with the original daily cron and media router unchanged.
- Failure class: `MIRA_FRESH_DATED_SOURCE_EXHAUSTED`; 26 of 27 recent qualifying rows lacked provider-verifiable publication dates, and the one dated source was already reserved.
- Scoped implementation: replace one generic query with topical billing/receivables searches within the same eight-search budget; recognize additional exact Dutch receivables phrases in the existing problem classifier.
- Regression: `tests/brain-mira-entrepreneur-radar-materializer-20261027.test.mjs` tests query budget, precision and unchanged freshness validation.
- Guardrails: no false source timestamps, publisher changes, synthetic assets, media-quality bypass, new scheduler, paid retry or alteration of prior publication obligations.
- Status: code candidate only; protected CI, native source parity, fresh original source, verified Mira asset and independent Instagram provider readback remain unproven.
- Disclosure: this public event deliberately omits internal Brain operational details, private account identifiers, drafts, prospect content and credentials.
