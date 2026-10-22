# Terminal migration supersession without false red (2026-10-22)

Parent: #4681. Exact failing closure: #39840439339, job #120039732278. Original merged #4697 installed migration `20261022173500` and preserved service-only Brain incident ACL. Historical #4686 is CLOSED/UNMERGED and contains the SAME migration name with a DIFFERENT source blob. The old unmerged source never became production authority. The existing closure incorrectly fails unconditionally at `UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS`.

## Correction
Only an exact path present in the current **merged terminal successor** and its actual source tree can replace that retired candidate; all unmatched paths, bad migration versions, unknown source, absent files or unmerged/open targets remain rejected. Merged successor migration identities remain in the existing normal provider APPLIED + tenant/security gates. No direct migration or schema writes, no bypass, no second schedule, no incident store fork. Test helper includes positive and negative fixtures and validates exact terminal workflow wiring.

## Release gate
Protected Required and CodeQL on exact PR head, real first postmerge closure run, migration ledger/version/security readback and canonical Brain evidence before PROVEN. The failed manual run remains visible evidence; do not dispatch a duplicate unchanged run before this correction is merged.
