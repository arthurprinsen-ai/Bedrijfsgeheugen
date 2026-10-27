# Development ledger — Netlify control-plane early trigger v2

- Date: 2026-10-06
- Obligation: `control-plane-early-trigger-skill-projection-convergence-20261006-v1`
- Supersedes: retired PR #3961 for the remaining Netlify-only delta.
- Current main base: `441fe997aedeb3016a72e6b2689d2a124dfd3a9a`.
- Evidence: snapshot `37478237193` and release readback `37478237085` started for `e902e07f...` although both later proved deployment not applicable.
- Change: add `tools/ci/**` to both production workflow push-level ignore lists and regress it.
- Skill Projection portion: already absorbed by #3956 and post-merge run `37479280553` succeeded.
- Safety: shared Netlify applicability remains the in-job authority; mixed/runtime changes still fail closed.
