# Development ledger — predictive schema retry

Date: 2026-10-08

Obligation-ID: one-brain-predictive-schema-retry-20261008-v1

Root cause: the approved fallback provider sometimes returns an invalid forecast object. Without a bounded formatting retry, an otherwise reachable provider results in a failed run.

Correction: allow exactly one additional format-only request using the same previously sanitized public signals. Preserve the strict evidence whitelist and leave failed responses failed.

Scope: supabase/functions/_shared/predictive-approved-fallback.mjs; supabase/functions/powerhouse-predictive-engine/index.ts; tests/brain-predictive-approved-fallback-v1.test.mjs; brain/learning/2026-10-08-predictive-fallback-schema-retry-v1.json; docs/changes/2026-10-08-predictive-fallback-schema-retry-v1.md; this ledger.

Evidence: the local 18-test predictive suite and the canonical learning/material-writeback validations passed before release. Production confirmation and observable forecast outputs require separate provider readback.

Status: candidate, not production verified.
