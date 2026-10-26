# Netlify portal intelligence gateway hard deadline — P0 #4215 (2026-10-20)

Existing route /api/portal-ondernemersdata waits for a failing upstream Supabase Edge function, previously causing HTTP 504 after platform timeout. The endpoint's response helper also applied 60 seconds private caching and 240 seconds stale-while-revalidate to errors.

This patch applies a 23-second AbortController/hard deadline only to the entrepreneur_intelligence fetch. It propagates the abort through the HTTP transport, returns explicit 503 PORTAL_INTELLIGENCE_UPSTREAM_TIMEOUT and Retry-After: 20, and sends Cache-Control: no-store for any status >= 400 including unauthorized and forbidden. No partial/synthetic data and no fast error caching. Existing success path unchanged.

This contains load and improves failure honesty. It does not correct SQL bottlenecks. Readback is necessary: Required CI, CodeQL, authenticated two tenant HTTP 200, no cached error and exact Netlify deploy SHA. Existing #4539 for scheduler spacing and #4553 Edge transport cancellation remain the authority for their own scopes.
