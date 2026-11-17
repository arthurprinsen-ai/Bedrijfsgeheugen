# 17 november 2026 — Applied CRO consumer migration 881 parity in original source lock

- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Source release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5973
- Blocked unrelated website: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5975
- Original admission failure: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44156831371

## Provider-verified root cause
At 2026-11-17T19:22Z actual canonical provider `supabase_migrations.schema_migrations` held 881 applied version/name identities; latest `20261117192500_original_cro_consumer_source_diagnostics_v1`. Current main lock held 880 and omitted exactly that one genuinely applied identity, despite original #5973 production consumer release being applied. Website PR #5975 accidentally carried the correct lock update, creating 11 changed paths against its 10-file verified scope. Required rightly rejected the mixed-lane PR.

## Owner-scoped repair
Original Supabase migration release owner commits the **same existing** provider identity in `supabase/migration-history.lock.json`, preserving all 880 previous entries. No fresh migration execution, provider-history editing or scope-gate relaxation. Existing migration integrity regression tests and exact-head Required/CodeQL remain mandatory.

Once this separate PR is protected merged, `#5975` should contain its original 10 design paths. Site release remains dependent on own protected checks, current Netlify deploy and independent public page readback. Downstream GA4/SEO/lead and learning claims are separate and remain open until provider-backed proofs.

## Permanent prevention
Whenever any original migration owner applies SQL, require canonical provider identities and repository lock parity *before* releasing independent website/content PRs. Route a drift incident to the same original release owner, preserve other tasks without duplicating their writers and do not mark anything green on code-only success.
