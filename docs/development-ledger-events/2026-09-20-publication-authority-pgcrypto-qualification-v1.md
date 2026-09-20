# Development ledger — publication-authority-pgcrypto-qualification-v1

Date: 2026-09-20  
Obligation: `publication-authority-pgcrypto-qualification-v1`  
Lane: backend  
Failure class: `SECURITY_DEFINER_EXTENSION_SCHEMA_DRIFT`

## Observed

Instagram passed review and atomic dispatch claim, then capability issuance failed because `digest(text, unknown)` could not be resolved.

## Root cause

`pgcrypto` is installed in `extensions`, while authority SECURITY DEFINER functions use locked `search_path public,pg_catalog` and referenced pgcrypto functions without schema qualification.

## Change

Schema-qualify all pgcrypto calls in issue/consume authority functions while preserving the locked search path and all authorization checks.

## Evidence

- `supabase/migrations/20260920102500_publication_authority_pgcrypto_qualification.sql`
- `tests/brain-publication-authority-pgcrypto-qualification.test.mjs`
- `brain/learning/2026-09-20-publication-authority-pgcrypto-qualification-v1.json`
