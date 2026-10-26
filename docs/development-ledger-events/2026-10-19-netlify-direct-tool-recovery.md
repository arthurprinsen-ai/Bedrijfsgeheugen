# Netlify fallback integration delivery ledger

Obligation-ID: netlify-account-scoped-direct-tool-recovery-20261019
Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
Source diagnostic: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39221115055

Observed: Composio rejects project-visible Netlify toolkit at v3.1 session creation with HTTP 400, while it allows account discovery. Do not mislabel this as missing account/permission or an activated provider.

Candidate: replace unnecessary session router with Composio's independently authenticated direct tool execution, pinned to exactly the same project key, connected account and user. Main-ref GitHub OIDC guard and production SHA proof remain. Health can only issue a read-only `get-project`, and must match the intended site; fallback can use only `deploy-site` inside the canonical exact-source release owner.

Verification state: protected merge / Supabase exact-source / OIDC provider health / actual provider deploy / functional production readback PENDING. No new scheduler, side-channel, repository, token, permission, or tenant policy introduced.
