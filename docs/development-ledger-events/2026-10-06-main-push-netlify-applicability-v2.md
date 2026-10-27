# Development ledger — main-push Netlify applicability v2

- Date: 2026-10-06
- Obligation: `main-push-fanout-budget-20260925-v1`
- Supersedes stale candidate: PR #3091
- Failure class: `CI_UNNECESSARY_NETLIFY_DEPLOY`
- Failed snapshot: run `37470438032`, SHA `e6e676c670127b7378143688b684f6ef8ba6294f`, three 401 exact-source attempts.
- Waste proof: Supabase-only SHA `2b0539cb729b658bc5e85184406d8421e56f9d35` triggered run `37471619096` and Netlify deploy `6ac4f8719740e80008deedb7` (124 seconds).
- Root cause: four independent Netlify applicability rules drifted.
- Fix: one canonical applicability module shared by PR parity, native build-ignore, snapshot and release readback; pure Supabase pushes are excluded from the two Netlify production workflows.
- Safety: website, portal and Netlify-hosted runtime remain exact-SHA/readback gated; unknown classification fails closed.
