# 2026-09-24 — provider credit + deploy auth recovery

Observed evidence:
- Anthropic production API: HTTP 400 `invalid_request_error`, insufficient credit balance.
- Website QA on the same account: HTTP 502, confirming provider/account-wide failure.
- Production Source Snapshot run `35974869594`: Netlify MCP fallback HTTP 401.
- Emergency nested-zip upload was detected by Netlify readback and rolled back to a full known-good source.
- Temporary diagnostic/deploy relay was made inert immediately after every use.

Hardening:
- classify credit/auth errors;
- no retry for non-transient provider failures;
- prefer durable Netlify auth;
- classify expired ephemeral MCP proxy;
- preserve exact-source/root-archive proof;
- add regression + skill projection.

Open external boundary: Anthropic API credits must be replenished (or a second production translation provider must be configured) before static English production can pass fail-closed generation and browser proof.
