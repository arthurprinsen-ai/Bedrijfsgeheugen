# Netlify reserve-deploy — verified account selection after OAuth renewal

## Production evidence
The owner reconnected Netlify in Composio Platform's existing DCR OAuth Auth Config, with the Netlify project reader and deploy updater already on the execution allowlist. The UI now shows **two ACTIVE, one EXPIRED** connection entries. Protected OIDC health-only run [#39234783733](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39234783733) queried 50 project-visible accounts and found **two ACTIVE eligible Netlify accounts**, complete identifiers and not disabled; still the first matching account failed Composio tool execution HTTP 400. The historical upstream Netlify MCP failure from the old Platform connection was `HTTP 401 Unauthorized`. No live evidence yet establishes that the new account can read this site.

## Defect and secure correction
The existing bridge used `payload.items.find(...ACTIVE)`, stopped scanning upon its first match and never validated live Netlify access before using that account for a write-capable deploy proxy. With two active account records after renewal, the first match can be stale.

The bridge now enumerates all cursor pages within the existing page/time bounds, caps the eligible candidate pool at four, and tries a strictly read-only `NETLIFY_MCP_NETLIFY_PROJECT_SERVICES_READER/get-project` for each candidate, starting with the newest OAuth creation where timestamps are available. Every session is pinned to its exact Composio account and user. It only selects a context if Netlify provider readback contains the fixed site ID. Failure of all candidates produces HTTP 424 and preserves the hard authorization block. Health never invokes `deploy-site`; production proxy/deploy authority is derived only from the same independently verified context.

No tokens, account IDs, user IDs, team authorization or per-account payloads are logged. No Composio account is deleted, refreshed or reconnected, and no new cron, queue, scheduler or publisher is created.

## Evidence and closure
- Required CI, CodeQL and protected merge
- Exact-source Supabase Edge Function readback
- Protected GitHub OIDC health read-only success tied to provider site readback
- Only then the existing canonical fallback Netlify production release with a real deploy ID, exact source SHA and functional public readback
- Keep P0 [#4447](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447) open until the entire fallback is proven

Do not infer fallback recovery from connection status or green code checks alone.
