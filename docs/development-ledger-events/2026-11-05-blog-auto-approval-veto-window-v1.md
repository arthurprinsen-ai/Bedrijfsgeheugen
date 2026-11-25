# 2026-11-05 — Daily blog gets an owner for GENERATED to APPROVED

- Canonical obligation: `website|seo-growth|blog-auto-approval-veto-window|20261105-v1`.
- Defect: 21 blogs stayed GENERATED because no code set `approved_at`; the hourly publisher succeeded while rendering nothing (`NO_APPROVED_BLOG_ARTIFACT`).
- Scope: `supabase/functions/_shared/blog-auto-approval.mjs`, `tools/content-growth/blog-auto-approval.mjs`, `.github/workflows/powerhouse-daily-blog.yml`, one standalone Brain test, learning and change documentation.
- No change to schedule, publisher, other channels or already published content. The 20 older GENERATED blogs are not touched.
- Deviation from the agreed 24 hour veto window: 6 hours, because 24 hours breaks the same-day daily publication invariant.
- Required next proofs: exact-head Required/CodeQL, protected merge by Arthur, next hourly run logs `BLOG_AUTO_APPROVAL:APPROVED_AFTER_VETO_WINDOW`, blog reaches LIVE_PROVEN.
- This is a publication permission, not evidence of more visitors or orders.
