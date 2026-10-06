# 2026-10-06 — CI relevance gating

Obligation: `development-critical-path-acceleration-20261006-v3`

Observed:
- the repository had 124 workflow files and heavy concurrent Actions fan-out;
- Powerhouse CodeQL ran on every pull request independent of changed surface;
- Supabase Preview Applicability checked out the candidate before deciding whether Supabase was relevant;
- stale writer work and Netlify/Notion overhead were already addressed on main by PR #3878.

Implemented:
- added a cheap PR-files applicability job before heavyweight CodeQL analysis;
- added a GitHub-API changed-file precheck before Supabase checkout;
- retained exact-head provider verification for database-relevant Supabase changes;
- added regression coverage to the critical-path acceleration contract.

Readback:
- Supabase Preview Applicability returned success in roughly eight seconds for a candidate with no `supabase/**` changes;
- CodeQL applicability returned success before the heavyweight analyzer;
- Required test reached the repository closure requirement with prior regression stages green.

Safety:
- no branch-protection requirement is removed;
- no database migration or production data is changed;
- no credential or OAuth behavior is changed;
- workflow-level path filters remain intentionally avoided for required checks.
