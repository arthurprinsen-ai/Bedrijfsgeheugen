# Append-only 2026-11-15 original personal source supplier parity

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|linkedin|original-radar-accepts-truncated-source|20261115-v1`
- Original source owner: original powerhouse-mira-problem-radar-v1 and original SQL `powerhouse_ensure_personal_source_rotation_v2(date)`; same eight searches and no parallel publication.
- Observed production: 143-character source ending ellipsis, 6 failed personal truth-copy generations, no provider ID. Publisher and editor remain strict after merged #5858/#5865/#5868.
- Root cause: original producer accepted >=60 and basic news snippets while personal consumer enforced >=240. Early EXISTING source check falsely reported ready.
- Prevention: two original personal searches use advanced 3-chunk Tavily; producer/source RPC require >=240 and nontruncated dated HTTPS, explicit typed ONE BRAIN shortage, source no-post fallback; original publisher remains on and must never blindly retry possible provider effects.
- Immutable migration: `supabase/migrations/20261115162500_original_personal_source_supplier_completeness_v4.sql`; ACL preserved.
- Regression: `tests/brain-original-personal-radar-source-parity-20261115.test.mjs`, original radar and HTTP suite.
- Evidence due: protected checks, original applied migration and Edge readbacks, original LinkedIn provider ID+GET, named ONE BRAIN consumer PROCESSED, measured Heartbeat.

## Reconciled with protected #5874
The original no-resurrection migration in PR #5874 merged first. This follow-on `supabase/migrations/20261115162500_original_personal_source_supplier_completeness_v4.sql` derives from its exact provider source and preserves quarantine, `ON CONFLICT DO NOTHING`, rejected source identity and row-count readback. It only strengthens source completeness and direct URL requirements. Protected PR #5873 was closed without merge; this superseding candidate is the single source-admission patch.
