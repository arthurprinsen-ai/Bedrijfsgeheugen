# Bedrijfsgeheugen delivery ledger — Composio Platform Netlify account shape

Obligation-ID: netlify-platform-connected-account-diagnostics-20261019
Canonical P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
Reference OIDC run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39225906308

A Platform screenshot confirms active Netlify_mcp DCR OAuth connection under pg-test and historical expired account, while canonical owner has no visible Netlify connection. Existing code is deliberately user-ID agnostic and already pins an eligible ACTIVE account to its exact provider user. Nonetheless the API key returned 54 accounts and no eligible Netlify account. The discrepancy is factual, not evidence of a specific wrong user ID.

Patch adds bounded, account-ID-free counts to the existing account-scan diagnostics; does not expand user, provider or release authority. Existing auth flow and OIDC strict checks unchanged. CI/test and protected merge required. Production outcome unproven until source parity and actual provider readback; no new Netlify publish was requested.
