# 2026-10-05 — Supabase migration-history canonical v6

Obligation: supabase-migration-history-canonical-v6
Issue: #3742
Candidate: PR #3766

Structural actions:
- canonicalized production-backed migration identities;
- archived repository-only historical SQL outside the executable lane;
- preserved four explicit replay baselines required for deterministic fresh reconstruction;
- proved fresh hosted Supabase replay succeeds;
- kept production repair fail-closed and tracking-only;
- retained exact-head writer lease and no-manual-bypass rules.

Open terminal dependency:
- protected merge of the trusted repair control plane (#3768);
- supported `supabase migration repair --status applied` for the four allowlisted replay versions;
- production ledger readback and lock transition to `REPAIRED_APPLIED_VERIFIED`;
- exact-head GitHub gates;
- protected merge and post-merge production readback.
