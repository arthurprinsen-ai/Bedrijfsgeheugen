# Composio Instagram setup controller

Fingerprint: `instagram-composio-connect-link-setup-v1`.

Powerhouse now has a canonical server-side bootstrap controller for Instagram transport. It is protected by the existing Powerhouse scheduler token and reads `COMPOSIO_API_KEY` only from environment/Vault.

Actions:
- `status`: verify API-key presence and exactly one ACTIVE Instagram connected account.
- `create_link`: reuse or create exactly one Composio-managed Instagram auth config and create a hosted Connect Link.

The controller never returns the Composio API key. It fails closed when multiple active accounts or auth configs exist. OAuth provider credentials remain inside Composio.
