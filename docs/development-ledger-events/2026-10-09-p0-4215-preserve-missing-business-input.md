# Development ledger — P0 #4215 lost partial BusinessInput fields

- Obligation-ID: `p0-4215-preserve-missing-business-input-20261009-v1`
- Date: 2026-10-09
- Class: `CANONICAL_BUSINESS_INPUT_PARTIAL_FIELD_LOSS`
- Root cause: both canonical BusinessInput projection and Supabase Brain authority read-repair were shallow-upserting an answers object and ignoring `metadata.preserveMissing=true`.
- Scope: shared pure helper, existing Netlify projector, existing Supabase read-repair, protected synthetic regression, documentation and learning.
- Prevention: contract tests for deep object preservation, explicit overwrites, empty replacements, chronological replay, stale records and safe object keys.
- Live proof boundary: Netlify + Supabase Edge deployment readbacks and distinct real client/customer sessions remain separately required.
