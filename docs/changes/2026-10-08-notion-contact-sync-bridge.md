# Notion LinkedIn contacts → canonical POWERHOUSE CRM

Obligation: `notion-salesrobot-canonical-contact-webhook-20261008-v1`  
Status: CANDIDATE, **not production-verified**. External SalesRobot sends remain blocked.

## Existing-state-first
- Single execution authority: Supabase. Existing Edge Function `bg-notion-sync`, existing canonical table `public.bg_connecties`; never restart Make or establish a parallel sender.
- Notion source: `Connecties-kern` data source `3b2da36a-ac8a-80f1-a78d-000b4766fd4c`; parent: https://app.notion.com/p/3b2da36aac8a80bd9334eb9ec351766f
- Live preflight: Notion core 8,888 rows; 8,884 LinkedIn URLs; 88 rows say `LinkedIn DM`, none say contact policy `Vrij`. Canonical Supabase CRM has 23,295 rows.
- Those counts are inventories, **not DM send-ready contacts**. Do not bulk-export or create SalesRobot prospects from them.

## Implementation
- Existing `POST /functions/v1/bg-notion-sync` remains unchanged for scheduled dagplan/media work.
- Dedicated webhook event route: `POST /functions/v1/bg-notion-sync?mode=notion-contacts`.
- One-time unsigned Notion setup payload is handled without side effects. Verification token is written to restricted Supabase Edge Function logs for administrator retrieval; treat it as a secret and restrict log access/retention.
- Subsequent events require `X-Notion-Signature` HMAC-SHA256 verified on exact raw request body using `NOTION_WEBHOOK_VERIFICATION_TOKEN` from Supabase Vault (`bg_geheim`). No token → HTTP 503; invalid signature → HTTP 401.
- Event types: `page.created`, `page.properties_updated`, `page.moved`, `page.undeleted`. Fetch actual current page via Notion API; reject wrong source, deleted pages, and invalid personal LinkedIn URLs.
- Update **existing matched** `bg_connecties.extra.notion_contact_context` only (bounded single-contact operation), with optimistic concurrency and stale timestamp protection. Never create a new CRM row or overwrite opted-out/suppressed policy. The projected flag `can_send` is always false.
- Per-real-write sync evidence goes to existing `bg_notion_sync`. Status of external SalesRobot sends is independent.

## Required external configuration
1. In the **existing** Notion integration's Webhooks tab, create a subscription with public HTTPS endpoint above. Subscribe to `page.created`, `page.properties_updated`, `page.moved`, `page.undeleted`. Ensure the integration can read `Connecties-kern`.
2. Retrieve `NOTION_CONTACT_WEBHOOK_SETUP_TOKEN_FOR_ADMIN` from private Supabase `bg-notion-sync` function logs (one-time unsigned setup event). Store that exact token securely in Supabase Vault under `NOTION_WEBHOOK_VERIFICATION_TOKEN`; never paste it into GitHub, Notion pages or chats.
3. Click **Verify** in the Notion Webhooks tab and enter the setup token. Confirm subscription ACTIVE and send a benign update to an existing test contact. Verify signed event ACK, matched existing CRM row, `extra.notion_contact_context` readback and `bg_notion_sync` evidence.
4. Independently reconcile Notion–CRM matching coverage and remaining unlinked 8,888 Notion rows before considering any background backfill. **This webhook is change-driven, not an initial bulk import.**

## Acceptance before live
- Local regression `tests/brain-notion-contact-webhook-v1.test.mjs`; Required, CodeQL and Supabase Preview on the exact HEAD.
- Protected merge into main and runtime deployment of exact SHA, source hash readback.
- Independent actual Notion event readback and canonical-row readback; evidence for duplicate and unsupported events.
- Zero automatic sales sends until SalesRobot subscription days, active campaign/prospects, recipient eligibility, message quality, approval and external provider delivery receipts are separately proven.

Official docs: https://developers.notion.com/reference/webhooks and https://supabase.com/docs/guides/functions/auth
