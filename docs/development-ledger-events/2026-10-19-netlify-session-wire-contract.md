# Delivery ledger — Composio session create request contract

Obligation-ID: netlify-composio-request-toolkit-enable-20261019
Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447

Evidence chronology: v163+ connected account pagination finds an active Netlify account in the Supabase Composio project. OIDC is valid. Legacy session attempts returned HTTP 400 TOOLKIT_CONSTRAINT. Direct tool fallback returned HTTP 200 but successful:false. Owner-provided API Keys dashboard displays two Full access keys, so missing API-key permission is not established.

Source root cause found via official Composio SDK examples: `toolkits.enabled` was incorrectly submitted to the create endpoint, whereas `toolkits.enable` is required. Reintroduced the one narrowly scoped session with this corrected field. Reconciled three existing historical tests; retained pinned user/account, main-only GitHub OIDC, read-only Netlify project health and fixed deployment tool.

Status: no provider-authorized success claimed until protected CI, merge, Supabase source/version readback, OIDC provider health and actual Netlify production deploy proof. Historical failure data preserved.
