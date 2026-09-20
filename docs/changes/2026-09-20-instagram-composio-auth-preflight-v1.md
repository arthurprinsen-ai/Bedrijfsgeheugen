# Instagram Composio auth preflight

Fingerprint: `instagram-composio-auth-preflight-v1`.

When `COMPOSIO_API_KEY` is absent, Instagram now stops before atomic dispatch claim, publication-capability issuance/consume and any provider call. The canonical decision remains `content_ready`, the obligation records `COMPOSIO_INSTAGRAM_AUTH_REQUIRED`, and no fallback transport is selected implicitly.
