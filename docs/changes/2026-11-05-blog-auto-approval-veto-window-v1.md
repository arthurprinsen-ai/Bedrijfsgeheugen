# Daily blog: approval step with a veto window

**Date:** 5 November 2026. **Status:** candidate, not production-proven until protected delivery and a live blog.

The daily blog was generated but never published. `powerhouse-blog-queue` writes the obligation as GENERATED. `powerhouse-blog-export` only exports a blog whose obligation has `approved_at` and status APPROVED, PUBLISHED or LIVE_PROVEN. Nothing moved a blog from GENERATED to APPROVED, so the hourly workflow reported success while it printed `NO_APPROVED_BLOG_ARTIFACT`, skipped the candidate PR and left 21 blogs GENERATED without an error. All 18 blogs that did go live had `approved_at`.

## Bounded implementation
- `supabase/functions/_shared/blog-auto-approval.mjs`: pure decision. APPROVE only for a GENERATED row of the current Amsterdam business date with slug and content id, a publish decision, a passing official-date gate, no veto and an elapsed veto window.
- `tools/content-growth/blog-auto-approval.mjs`: reads the three source rows, decides, and approves through the existing `record_content_publication_state` function with an evidence record. Missing credentials or a failed write fail the step.
- `powerhouse-daily-blog.yml`: one new step before the writer step. No new schedule, publisher, table or edge function.

## Decisions and deviations
- **Veto window is 6 hours, not 24.** A 24 hour window pushes each blog past its own business date, and `bg-content-publication-daily-assert` (18:35 and 19:35 UTC) would fail every day. The blog is generated around 00:27 local time, so 6 hours ends before the morning.
- **Veto:** set `evidence.veto = {"active": true, "reason": "..."}` on the obligation before `eligible_at`. After approval, pull a blog back through the protected PR.
- **Stale rows** (20 older GENERATED blogs) are never approved here. They need a per-blog decision.
- Reader-ready check (render), official-date gate (export) and protected PR checks are unchanged and still run.

## Not proven yet
No notification reaches Arthur when a blog enters the window. Protected merge, the first logged `APPROVED_AFTER_VETO_WINDOW` and a LIVE_PROVEN blog are still to be shown. This is a publication permission, not evidence of more visitors.
