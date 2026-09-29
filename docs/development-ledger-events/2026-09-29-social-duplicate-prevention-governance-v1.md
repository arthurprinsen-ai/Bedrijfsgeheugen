# Development ledger — social duplicate prevention governance v1

- Date: 2026-09-29
- Obligation: social-duplicate-prevention-governance-v1
- Delivery lane: docs
- Incident: consecutive LinkedIn company posts reused the same employee-absence/knowledge-in-heads story family.
- Runtime prevention: already merged and deployed through `linkedin-company-historical-dedupe-v1`.
- Governance projection: LinkedIn skill + continuity skill + AGENTS + canonical System Map.
- Retired story family: `employee_absence_or_departure__knowledge_only_in_heads`.
- Regression: `tests/brain-social-duplicate-prevention-governance-v1.test.mjs`.
- Invariant: historical story uniqueness is mandatory and separate from atomic daily idempotency.
