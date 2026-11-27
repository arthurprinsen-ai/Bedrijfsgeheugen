# Original provider 829 migration source lock — 12 Nov 2026

Fingerprint: supabase|migration-history|provider-829-lock-parity|20261112-v1
Provider readback: Supabase production project adhjwmvyoixzjtmiroln count 829, latest version 20261112144500, name original_social_legacy_alias_acks_v1.
Source evidence: exact main SQL file supabase/migrations/20261112144500_original_social_legacy_alias_acks_v1.sql and original migration-history.lock.json count 828.
Root cause: two-stage migration applied/source lock handoff not atomic before next original protected PR started.
Corrective action: append-only one source lock entry, no database operation, preserve existing 828.
Regression: existing tests/brain-cro-production-migration-lock-20261029.test.mjs and tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs.
Terminal: protected PR merge and exact current main plus independent Supabase 829/829 readback. Original ONE BRAIN consumer acceptance required; do not mark commercial outcomes green.
