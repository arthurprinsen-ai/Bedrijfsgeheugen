# 2026-10-20 — economics function-first P0 #4215

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215. Source-approved PR #4540: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4540. Full index+function migration returned PostgreSQL 57014, while live economics function remained unbounded. Recovery uses existing function and ACL from #4540 in one guarded 12s function-only transaction. Initial status: SOURCE_CANDIDATE; no live DDL or green readback yet. Index, signed portal API and two customer readbacks remain open independently.

## Admission repair — protected CI
The first hygiene/admission run failed with `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`, not a SQL test failure. The PR body now includes the immutable main baseline SHA `4a1e2dfbbdd6f9dc7583b7e6bdfc36e13e1208af`. This append-only note initiates exact-head Required and CodeQL validation without any branch-protection override; no production deployment has occurred for this recovery.
