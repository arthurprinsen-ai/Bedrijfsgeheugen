# Instagram Meta direct primary transport v1

Fingerprint: `instagram-meta-direct-primary-v1`

The canonical Instagram writer remains `powerhouse-social-publisher`. Mira identity, exact-final-media proof, atomic claim, one-time publication capability and dedupe remain mandatory before any provider mutation.

Transport order is now:
1. direct Meta Instagram API when `META_INSTAGRAM_ACCESS_TOKEN` + `META_INSTAGRAM_USER_ID` are available;
2. Composio as bounded secondary transport;
3. Buffer only as the existing bounded fallback.

Direct Meta creates the Reel container, waits for `FINISHED`, publishes the container, then reads back the exact media id. If publication succeeds but readback is temporarily unavailable, the decision stays `dispatching` with that exact media id and must be reconciled; it must never republish blindly.

Required secrets:
- `META_INSTAGRAM_ACCESS_TOKEN`
- `META_INSTAGRAM_USER_ID`
- optional `META_INSTAGRAM_GRAPH_VERSION` (defaults to v24.0)
