# 2026-10-25 — One-topic external source provider recovery

## Independently observed failure
Actual Supabase request 12486 ran HTTP 207: three topics, two successful, one failed. Tavily plan limit caused a DataForSEO fallback; the long Skills en capabilities query reproduced DataForSEO status 40101 Internal SE Server Error. A shorter meaning-equivalent query returned actual DataForSEO search results.

## Existing owner correction
Re-use the same token-authenticated Edge Function, three-topic selection, provider fallback, source table and canonical observation. Inspect both HTTP and DataForSEO task status codes. Retry only one additional time on known transient errors, with a shorter query for 40101/40103. Do not retry permanent authentication, billing or malformed-input statuses. Preserve organic-only output and unknown dates.

An explicit retry_topic is only permitted if the latest immutable canonical producer evidence from the past 24h proves that exact active topic failed. Replays are limited to the one failed topic; successful topics are not re-fetched. Distinct replay fingerprints, actual provider route and remediation strategy are recorded.

## Terminal proof
Exact-head Required and CodeQL; protected merge; deploy both source and module into Supabase Edge; verify live version; run one authenticated failed-topic replay through the existing Powerhouse request function; verify HTTP outcome and actual source observation. Provider errors never become fictitious wins, new customer orders or paid revenue.

No new scheduler, queue, CRM, unconsented outbound action or weakened authorization.