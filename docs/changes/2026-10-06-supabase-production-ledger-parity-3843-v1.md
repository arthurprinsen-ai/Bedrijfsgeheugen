# Supabase production-ledger parity after PR #3843

PR #3843 exposed a real migration-history drift: production had moved beyond the repository lock. The first bounded recovery brought the historical mirror set from 568 to 583 applied identities through `20261006095958_normalize_publication_evidence_objects_v1`.

Production subsequently advanced by eight LinkedIn organization-OAuth migrations through `20261006103856_linkedin_company_live_proof_state_canonical_v3` without those exact SQL files entering canonical `main`. PR #3870 therefore now closes **current** production parity instead of freezing the old snapshot: 591 applied identities and 20 restored production mirrors in total.

The eight additional mirrors are copied byte-for-byte from their original Git recovery lineage. The security contract accepts each historical mirror only while its Git blob SHA exactly matches the reviewed production statement. Any edit immediately falls back to the normal fail-closed migration security checks.

Supabase Preview Applicability skips provider database preview only when every database-relevant changed file is an exact registered historical mirror. `supabase/migration-history.lock.json` remains non-executable metadata. Ordinary migrations, unknown files, renamed copies and any changed mirror still require the normal provider proof.

Future recurrence is handled separately by the protected-main Supabase production-authority contract: production promotion must originate from protected `main`, so new production-only migration or Edge lineage is not allowed to accumulate again.
