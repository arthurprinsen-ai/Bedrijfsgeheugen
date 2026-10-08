# Development ledger — Notion contact webhook into ONE BRAIN

- Date: 2026-10-08
- Obligation: notion-salesrobot-canonical-contact-webhook-20261008-v1
- Problem: Notion LinkedIn contacts had no confirmed webhook into canonical Supabase CRM, while SalesRobot was non-executable.
- Existing state: `bg-notion-sync` already handled dagplan/media; `bg_connecties` 23,295 canonical records; Notion core 8,888 records, none marked `Contactbeleid=Vrij`.
- Correction: signed event route added to existing sync; read current Notion page; normalize identity; metadata-only optimistic write to existing CRM record; no change to send authority.
- Scope: `supabase/functions/bg-notion-sync/index.ts`, `supabase/functions/bg-notion-sync/notion-contact-projection.mjs`, `supabase/functions/bg-notion-sync/notion-contact-webhook.mjs`, `tests/notion-contact-webhook-v1.test.mjs`, `docs/changes/2026-10-08-notion-contact-sync-bridge.md`, `brain/learning/2026-10-08-notion-contact-sync-bridge-v1.json`, this ledger.
- Controls: invalid signature 401; no setup secret 503; invalid source/URL ignored; existing records only; no send flag set.
- External effects: No messages or campaign activation performed. Webhook creation/verification in Notion and production runtime deployment are NOT claimed.
- Regression: tests/notion-contact-webhook-v1.test.mjs.
- Verification pending: Required/CodeQL/Supabase Preview, protected merge, runtime hash and real signed webhook readback.
