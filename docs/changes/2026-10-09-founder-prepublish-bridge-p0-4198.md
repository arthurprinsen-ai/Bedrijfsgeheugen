# Existing Edge v26 founder gate — GitHub source parity, P0 #4198

## Verified root cause
GitHub main still contained an old personal-life-only `bg-pre-publish-review` implementation. Readback of the **actual active Supabase Edge v26** showed the independently verified AI-native founder lane **already working in deployed source**. The original candidate could therefore have removed production guards. This change backports **exact active v26 source** into the existing GitHub canonical file, with no added executor or new Brain, scheduler or database.

## Independently open operational gap
On 9 October 2026, `powerhouse_channel_decisions` recorded personal LinkedIn provider URN `urn:li:share:7514285740868911105` but Composio `LINKEDIN_GET_POST_CONTENT` returned Forbidden (403), and an alternative connected personal account returned Unauthorized (401). A post URN is not successful independent content readback. Do not republish or mark an outcome as delivered without independent provider evidence.

## Source-to-runtime contract
Source parity means GitHub implementation must not regress active Supabase Edge behavior: verified builder event, Arthur provenance, source lineage, no technical jargon, no sales pitch, exact final text hash, privacy and separated personal/company identities. Production retains v26 while protected PR admission/tests/CodeQL/merge are pending. The existing Heartbeat, Powerhouse and Brain operate a single 8-stage loop. This is not a declaration of full commercial closure.

## Evidence
- GitHub recovery: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4264
- Master issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Regression: `tests/brain-founder-prepublish-bridge-p0-4198.test.mjs`
- Current-state Notion: https://app.notion.com/p/3dcda36aac8a8152be3dedbb32b06239
