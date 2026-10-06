# Supabase production-ledger parity after PR #3843

PR #3843 merged at `47e36a513757c230ca6305a06a3724338fea047d`. Production readback showed that the migration ledger for that merge snapshot contained 583 applied identities, while the repository lock still represented 568 and twelve already-applied post-recovery statements were absent from repository history.

PR #3861 restores those twelve statements as immutable historical mirrors and binds the migration-history lock to the #3843 snapshot: 583 applied identities through `20261006095958_normalize_publication_evidence_objects_v1`. Production migrations applied after that snapshot are deliberately outside this obligation.

The security contract accepts a restored mirror only while its Git blob SHA exactly matches the reviewed statement. Any edit makes the normal fail-closed migration security checks apply again. Supabase Preview Applicability treats a database change as not applicable only when every executable database-relevant changed file is one of those exact registered mirrors; `supabase/migration-history.lock.json` is metadata and does not itself require a database preview.
