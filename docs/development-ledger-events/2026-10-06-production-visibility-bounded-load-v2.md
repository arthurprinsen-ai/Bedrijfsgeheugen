# 2026-10-06 — production visibility bounded-load recovery

- Trigger: Canonical brand shell live readback run `37436641401` on main `52460f88df1d48a5c51e1b9582fdd87e119a325b`.
- Production Source Snapshot `37436641505`: success.
- Production Release Readback `37436641445`: success.
- Shell + SEO + growth endpoint proof: success before the visibility sweep.
- Visibility failures: two transient 403 responses and one no-response on independently healthy English routes.
- Root cause: workflow override allowed up to 24 simultaneous browser navigations against canonical production.
- Fix: workflow 4×2 bounded concurrency plus an in-code canonical-production clamp at 4 route workers / 2 viewport workers.
- Coverage retained: every sitemap route × phone/tablet/desktop; retry, visibility, occlusion, content, CLS and global time-budget assertions unchanged.
- Production applicability: standalone visibility verifier added to canonical verifier-only paths in contract, release classifier, snapshot ignore rules and regression.
- Closure: exact-HEAD CI → protected auto-merge → Canonical brand shell live readback success; no website redeploy solely for verifier maintenance.
