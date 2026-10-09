# P0 #4215 — complete Brain input history
Obligation-ID: p0-4215-business-input-history-pagination-20261009-v1

The existing Supabase canonical-brain read repair returned only the oldest 1000 BusinessInput rows per tenant. Newer customer changes could be hidden.

The repair reads the existing tenant-scoped authority in deterministic batches of 500 ordered by updated_at and record_id. It fails explicitly when a page cannot be read or the maximum safe history size is reached; it never reports an incomplete read as fresh.

Regression: tests/brain-p0-4215-business-input-history-pagination-v1.test.mjs — 1501 inputs, deterministic ties, tenant separation, provider failures, capacity and boundary tests.

These are source-level tests, not two actual authenticated customer validations. Parent issue #4215 remains open until real consumer readback, >750KB durability and legal reviews are evidenced.
