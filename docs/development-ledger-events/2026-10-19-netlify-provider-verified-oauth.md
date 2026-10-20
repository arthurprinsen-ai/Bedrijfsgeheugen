# Delivery ledger — Netlify OAuth candidate proof

Obligation-ID: netlify-oauth-provider-verified-account-selection-20261019
Canonical P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
Evidence run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39234783733

Owner granted a new Platform Netlify OAuth connection via `netlify_mcp` Auth Config. The active Composio connected account count moved from one to two. OIDC health-only run found both but reported session tool reader HTTP400, consistent with an old first-active grant still being selected, although the actual selected connection wasn't exposed. Old provider upstream HTTP401 Unauthorized is independently proven. Source defect: previous bridge blindly uses first ACTIVE account.

Change: bounded complete cursor scan, provider verification using Netlify read-only get-project for each eligible candidate, newest-first as preference, hard fail-closed if no real site proof, write-capable proxy only from the verified candidate, optional counts only in logs. Preserve all existing OIDC, source, deployment and tenant boundaries.

Status: candidate code/tests/Brain record pending protected CI/CodeQL, merge, Edge exact-source release, health and actual Netlify fallback provider+production readback. No claim of resolved reserve deployment until proven.
