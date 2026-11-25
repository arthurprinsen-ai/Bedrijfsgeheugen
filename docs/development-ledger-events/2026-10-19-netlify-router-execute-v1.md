# 2026-10-19 — Netlify Composio Tool Router v3.1 contract correction

Obligation-ID: `netlify-bridge-composio-router-v31-contract-20261019`
Fingerprint: `netlify-bridge|composio-v3.1|tool-preload-execute-envelope|20261019`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4437

**Before (measured):** Active exact Netlify account now exists in production bridge's Composio project; OIDC and account discovery pass. Authorized health request is rejected at Tool Router /execute with HTTP400, surfaced as bridge HTTP423 in run 39228816062.

**Fix candidate:** Narrow app-tool preload in pinned user/account session, plus Composio session response envelope parsing. Do not copy the session API key or browser OAuth material. Safety constraints unchanged: two tool allowlist, exact Netlify site, protected main OIDC, no synthetic provider readback, no unauthorized deploy.

**Regression:** `tests/brain-netlify-tool-router-execute-v1.test.mjs` covers preload and pinned identity, modern response envelope success vs explicit errors, OIDC, site match and no secret-bearing error logs.

**Closure:** Requires protected Required CI/CodeQL, immutable merge, actual Supabase Edge source parity, OAuth-backed provider health and exact SHA + authenticated production acceptance. Merely installing a linked account does not finish deployment.
