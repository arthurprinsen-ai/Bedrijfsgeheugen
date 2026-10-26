# P0 #4198 — independent content execution lanes

## Existing state and objective
One POWERHOUSE / BREIN / HEARTBEAT commercial authority and one content-loop schedule. Its orchestrator already materialized source-backed decisions into `powerhouse_channel_decisions`. Its publisher already accepted an explicit `channels` filter, but the supervisor did not use it: one multi-channel social invocation could suffer head-of-line blocking. One sequential generation candidate could starve a later channel.

## Implemented in this candidate
- Canonical bootstrap decides and materializes once.
- Separate, bounded and parallel generation invocations for ready LinkedIn personal, LinkedIn company, Instagram and blog candidates, scoped to their canonical decision rows. Scoped generation never reconciles the global decision set.
- Separate existing publisher invocations with exact `channels` filters for personal, company and Instagram; separate blog queue invocation; separate existing LinkedIn comment cockpit invocation. `Promise.all` collects individual outcomes, and the child invoker returns per-lane timeout or error instead of throwing the entire dispatch.
- No new cron, sender, Brain, CRM, provider account or contact collection. The provider never receives a post without the unchanged final identity, editorial, duplicate, media and one-time publication capability controls.
- A failed bootstrap no longer suppresses already materialized content unless its call might still be executing.

## Scope boundaries
The LinkedIn cockpit currently executes eligible comment actions, not a general-purpose reaction/like lane. Direct email is still governed by approved recipient selection, opt-outs and the existing outreach executor. LinkedIn DM stays with the verified existing SalesRobot/Composio campaign. This change does not fabricate provider IDs, permission, delivery or revenue; user authorization and provider API limits are still real hard boundaries.

## Post-merge evidence
Run both Node test suites and protected Required/CodeQL gates. Deploy the exact function revisions, read them back from Supabase, and collect actual per-channel provider receipts. Only mark PUBLICATION_SLA healthy when providers independently confirm publication; only close P0 #4198 when recipient-directed delivery and attribution/learning are also independently proven.

Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-05 and https://supabase.com/docs/guides/queues/pgmq
