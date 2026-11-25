# 2026-10-06 — Supabase runtime source parity / preview proof closure

Obligation: `supabase-runtime-source-parity-20261006`

Observed:
- PR #3843 auto-merged as `47e36a513757c230ca6305a06a3724338fea047d`;
- post-merge production readback reported `LIVE_VERIFIED` for the applicable backend release surface;
- the Supabase Git deployment still stopped during migrations, leaving production Edge Functions on mixed source versions;
- `powerhouse-content-loop` live source contained bounded-generation and typed SQL hotfixes absent from Git, but lacked the merged JSONB normalization and dedicated cockpit lane;
- `powerhouse-social-publisher` live source contained newer LinkedIn identity/evidence hardening absent from Git;
- `powerhouse-content-orchestrator` could safely move to the merged bounded implementation;
- the preview applicability gate could select an older completed provider check ahead of a newer in-progress check.

Implemented:
- deployed reconciled `powerhouse-content-loop` as production v30;
- deployed exact merged `powerhouse-content-orchestrator` as production v40;
- preserved production `powerhouse-social-publisher` v107 as the source authority and projected it back into Git;
- projected the reconciled content-loop source back into Git;
- changed Supabase Preview Applicability to select newest provider check by check-run id and require stable repeated success.

Readback:
- production orchestrator v40 source equals the merged repository source;
- content-loop v30 contains `NO_PENDING_ARTIFACT`, JSONB row normalization, `publish_only`, and the separate `cockpit_autopilot` call;
- LinkedIn Revenue Cockpit and Buffer Social Learning were green on the first exact HEAD of PR #3852;
- preview applicability for the function-only parity PR terminalized explicitly as not applicable.

Safety:
- production migration history was not manually mutated;
- no migration was added, removed, renamed, or repaired by this parity PR;
- no manual GitHub merge is used; protected auto-merge remains the only merge path.
