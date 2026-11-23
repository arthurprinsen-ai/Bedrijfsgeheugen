# Original personal radar ↔ source-rotation admission parity

Date: 2026-11-15. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Actual root cause
The original personal LinkedIn writer rejects snippets shorter than 240 chars and final truncated ellipsis, after PR #5868. The original daily radar still uses a basic Tavily News search, often yielding ~140 chars, and privileged existing function `powerhouse_ensure_personal_source_rotation_v2(date)` accepts >=60 and can declare `already_has_eligible_personal_source` for the 143-character original rejected source. A "source ready" provider status therefore did not imply the original editor had complete facts.

## Scoped corrective change
Reuse the original *same eight* provider queries: two personal use Tavily advanced with three contextual chunks per source; the other six retain basic. No new API account, job, second search, queue, scheduler or publisher. On every personal source, the existing radar validates >=240, no truncation ending, source date and direct URL, while retaining distinct original source and topic proof. The original source-rotation v2 function is replaced using a **new append-only protected migration**, never edits old migration files. Both original EXISTS and selection branches require complete, nontruncated, unused dated HTTPS. Existing SECURITY DEFINER search_path and explicit service-role-only execution ACL are preserved. Missing source creates one idempotent original ONE BRAIN failure record and an explicit `personalSourceState=SOURCE_RECOVERY_DUE`; an otherwise healthy Mira source does not masquerade as all-channel green. Independent channel writers proceed safely; the same radar continues to own source collection.

Official Tavily documentation: https://help.tavily.com/articles/6938147944-basic-vs-advanced-search-what-s-the-difference

## Acceptance
Protected Required + CodeQL + preview, exact main SHA, native Supabase provider migration count/filename and Edge source readback. This is **source-delivery repair**, not proof of a personal LinkedIn publication. Never mark full green without original LinkedIn URN/GET, named ONE BRAIN PROCESSED consumer and measured Heartbeat outcome.

## Reconciled with protected #5874
The original no-resurrection migration in PR #5874 merged first. This follow-on `supabase/migrations/20261115162500_original_personal_source_supplier_completeness_v4.sql` derives from its exact provider source and preserves quarantine, `ON CONFLICT DO NOTHING`, rejected source identity and row-count readback. It only strengthens source completeness and direct URL requirements. Protected PR #5873 was closed without merge; this superseding candidate is the single source-admission patch.
