# Portal Relevantie — brongebonden klantactie (25 oktober 2026)

**P0:** #4547; commercial learning #4198. **Obligation:** `portal:relevance-source-to-tenant-action:20261025-v1`.

Reproduced: Omgevingsradar signal cards showed scores and external links but lacked a direct, source-scoped recommended follow-up. The already-rendered `data-open-page="actieve-acties"` buttons in the action shortlist had no click listener.

Fix in the existing Portal V2 specialist workspace:
- Join external signal and action candidate **only** by exact canonical `signal_key`. Prefer authenticated tenant overlay; a canonical generic candidate never becomes a customer task.
- Show a plain-language next step, typed as `EXISTING_ACTION`, `TENANT_PROPOSAL`, `CONTEXT_REVIEW_REQUIRED`, or `SOURCE_RECHECK_REQUIRED`. Display an existing active-action link only for fresh, scored tenant evidence with an actual `canonical_action_ref`.
- Reject old source publication dates, old observations and passed deadlines before suggesting execution. Do not mistake re-ingestion for updated news.
- Bind the already-existing page navigation callback to `[data-open-page]`. Validate external URL protocol so source strings cannot inject executable links.
- No new scheduler, source table, customer mutation, sales send or synthetic business outcomes.

Verification: `node --test portal-v2/tests/relevance-next-action-source-truth-20261025.test.mjs` plus existing Portal CI, security and production readback. A compiled candidate is not live; do not claim tenant usability until authenticated click/readback.
