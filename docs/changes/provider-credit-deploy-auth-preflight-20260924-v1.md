# Provider credit + deploy authentication incident — 24 September 2026

## What actually failed

Two independent external boundaries blocked the pricing/i18n release:

1. **Anthropic account credit** — a direct production health call returned HTTP 400 `invalid_request_error` with the provider message that the API credit balance was too low. The same account also failed the website-QA Sonnet path, so this was not a Haiku/model-specific issue.
2. **Netlify terminal deploy authentication** — Production Source Snapshot run `35974869594` reached the deploy fallback but the persisted `NETLIFY_MCP_PROXY_PATH_TEMP` returned HTTP 401. Netlify MCP proxy URLs are short-lived credentials and must not be persisted as durable deployment authority.

## Additional recovery mistake

A first emergency API upload used GitHub's zipball without stripping its generated top-level folder. Netlify therefore published the repository inside a nested directory and omitted normal redirects/functions from the site root. The site was immediately recovered using a root-normalized archive based on the last known-good production source.

## Permanent prevention

- Non-transient Anthropic 400/401 errors are classified and fail immediately; only 429/5xx classes retry.
- Credit exhaustion has an explicit machine-readable error: `STATIC_I18N_PROVIDER_CREDIT_EXHAUSTED`.
- Production deployment prefers a durable `NETLIFY_AUTH_TOKEN`.
- An MCP proxy URL is permitted only as a short-lived per-run fallback and its 401 is classified as `NETLIFY_EPHEMERAL_PROXY_EXPIRED`.
- Source archives used for API deployment must be root-normalized and stamped with `.bg-source-commit`.
- English is never `LIVE_BEWEZEN` until provider readiness, exact production identity and browser-level English content are proven.

Canonical fingerprint: `provider-credit-deploy-auth-preflight-20260924-v1`.
