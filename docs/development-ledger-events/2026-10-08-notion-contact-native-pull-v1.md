# Development ledger — Notion contact native reconciliation

- Date: 2026-10-08
- Obligation: notion-salesrobot-canonical-contact-pull-20261008-v1
- Prior state: Existing Notion dagplan and media synchronization was healthy; signed Notion contact webhook existed in production but the provider subscription was not configured, yielding zero contact metadata updates.
- Recovery: Reuse only the existing bg-notion-sync schedule and canonical bg_connecties. Pull small Notion Connecties-kern batches with persisted cursor; update metadata of existing matched CRM rows only; no new senders or CRM copies.
- Protection: service-role-only RLS cursor state; optimistic CRM updates; explicit partial progress and error evidence. Contacts are not automatically qualified for LinkedIn DM.
- Scope: supabase/functions/bg-notion-sync/index.ts, supabase/functions/bg-notion-sync/notion-contact-pull.mjs, supabase/migrations/20261008182500_bg_notion_contact_pull_state.sql, tests/brain-notion-contact-pull-v1.test.mjs, brain/learning/2026-10-08-notion-contact-native-pull-v1.json, docs/changes/2026-10-08-notion-contact-native-pull-v1.md, this ledger.
- Verification: local learning tests + protected Required/CodeQL; deploy migration and Edge exact SHA; source-to-canonical contact proof mandatory.
- Status: CANDIDATE_NOT_PRODUCTION_VERIFIED. External SalesRobot delivery remains unproven.
