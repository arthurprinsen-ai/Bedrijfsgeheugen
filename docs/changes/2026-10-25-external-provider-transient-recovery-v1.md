# 2026-10-25 — Retain honest provider failures; bounded transient recovery

## Measured incident
Existing canonical source scan request 12486, Supabase Edge bg-externe-signalen v14: three topics attempted, two succeeded and one returned DataForSEO remote failure after Tavily quota-blocked fallback. HTTP 207; 18 real SERP hits, one approved by existing provenance gate. This is not commercial conversion or paid revenue.

## Root cause and scope
The same source owner has a DataForSEO fallback, but errors were surfaced without distinguishing temporary provider/server failures from exhausted subscription, bad credentials, invalid inputs and empty result sets. Do not add a second scanner or change account billing settings.

## Recovery
Use documented provider status categories to permit exactly ONE additional attempt only on an explicitly transient HTTP/server/processing error or fetch transport failure. Keep the existing three-topic bounded workload and daily source-coverage rotation. Failed second attempts stay a real provider error with HTTP 207 (when other topics succeed). Auth, rate-limit, billing and quota failures receive no retry. Provider 40102 no organic results is a legitimate zero, never synthetic opportunities.

## Tests and release acceptance
The existing Required suite for the exact provider path adds retry-success, retry-failure, fail-closed billing/auth/quota and empty SERP tests. CodeQL and protected merge are mandatory, followed by deployment of all relative Edge files with original x-powerhouse-token authentication intact. Finally run a real, authorized invocation through the canonical bg_roep_functie path and independently inspect pg_net response, canonical source observation and actual source rows. Do not mark FULL_GREEN if providers remain unavailable.
