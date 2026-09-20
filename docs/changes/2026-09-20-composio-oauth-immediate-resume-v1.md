# Composio OAuth immediate resume

Fingerprint: `composio-oauth-immediate-resume-v1`.

After the admin opens the hosted Composio Instagram OAuth link, Control Center polls setup status for at most five minutes. When exactly one ACTIVE Instagram connected account is detected, it sends one admin-authenticated `resume` action.

The setup controller then invokes the canonical `powerhouse-social-publisher` for the Amsterdam-local current date. Existing Mira identity, exact-media, publication-authority, idempotency and provider-readback gates remain authoritative.

No OAuth or API-key material is stored in browser storage.
