# Development ledger — instagram-composio-connect-link-setup-v1

- Date: 2026-09-20
- Gap: publisher transport existed without a canonical auth bootstrap path.
- Fix: admin-token protected Composio v3.1 status/connect-link controller.
- Secret boundary: COMPOSIO_API_KEY remains environment/Vault-only.
- Ambiguity policy: exactly one active Instagram account; never guess.
- OAuth policy: hosted Connect Link, provider credentials never stored in Powerhouse.
