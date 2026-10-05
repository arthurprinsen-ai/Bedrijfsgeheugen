# 2026-10-05 — Supabase migration-history canonical parity v4

Issue: #3742

Repository state was reconciled against the live Supabase migration ledger. The prior broad-recovery approach that reduced the executable lane to four files was rejected by fresh replay. Current main instead already contained all production versions plus 156 repository-only aliases.

Canonical action:
- archive 156 aliases byte-for-byte;
- correct two production version/name collisions from stored production statements;
- bind the executable lane to the 564-entry live ledger;
- strengthen the regression gate to reject both missing production migrations and extra repository-only executable versions.

Pre-merge status remains fail-closed pending exact-HEAD hosted Supabase Preview/replay and full required checkset.
