# Native Notion contacts reconciliation — existing POWERHOUSE hourly sync

Obligation: `notion-salesrobot-canonical-contact-pull-20261008-v1`.  
Delivery lane: backend. No new scheduler, Make flow, CRM table, direct outreach or SalesRobot prospect import.

## Live state before change
- `bg-notion-sync` is active and its existing dagplan + media lane runs successfully.
- The signed webhook from PR #4216 is deployed, but Notion has no verified subscription and the verification token is not configured.
- `Connecties-kern` has 8,888 rows. 5 checked LinkedIn profile URLs matched 5 existing `bg_connecties` records.
- No Notion contact metadata was synchronized before this change. No LinkedIn DMs were verified.

## Safe recovery
- Reuse the existing periodic `bg-notion-sync` invocation. After successful dagplan and media sync, query a small bounded page of the existing Notion Data Source `3b2da36a-ac8a-80f1-a78d-000b4766fd4c`.
- Reuse the canonical `notion-contact-projection.mjs` identity and metadata-only safeguards. Match **existing** Supabase CRM rows by personal LinkedIn URL and update only `bg_connecties.extra.notion_contact_context` using an optimistic timestamp check. Preserve opt-outs, existing commercial context and suppressions. No CRM inserts, no SalesRobot writes or sends.
- Record page cursor in RLS-enabled, service-role-only `bg_notion_contact_pull_state`. One run handles at most 3 pages of 50 contacts and checkpoints only after each completed page; retries re-process safely after partial failure. A completed cycle resets the cursor.
- Contact-pull failures are separately logged as `connecties-kern-pull` in `bg_notion_sync`; they do not turn a successful dagplan/media run into an artificial failure. Errors are surfaced in the run response with `contacts.ok=false`.
- This is an **incremental full-inventory reconciliation**, not a claim that all 8,888 contacts are synchronized at deployment. Coverage must be confirmed from `bg_connecties` and `bg_notion_contact_pull_state` readback.
- The existing signed webhook remains optional for faster updates, but its Notion subscription still requires external setup.
- The SalesRobot send gate remains independent. `Kanaal='LinkedIn DM'` and a matching profile URL do not prove consent, conversation or provider eligibility.

## Acceptance
1. `node --test tests/brain-notion-contact-pull-v1.test.mjs tests/brain-notion-contact-webhook-v1.test.mjs`.
2. Required, CodeQL, Supabase Preview, protected merge; exact main SHA and active `bg-notion-sync` runtime content hashes.
3. Confirm `bg_notion_contact_pull_state` table exists with RLS and anon/authenticated privileges revoked.
4. Confirm a genuine scheduled `connecties-kern-pull` run returns `contacts.ok=true` and incremented `extra.notion_contact_context` rows; one test contact's Notion `page_id` and timestamp must match the canonical CRM readback.
5. Do not claim full inventory coverage or external SalesRobot deliveries without evidence.
