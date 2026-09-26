# Instagram Composio proxy endpoint recovery — 2026-09-26

The provider preflight had a URL-construction bug: it performed string replacement on an API base that was already `/api/v3.1`, producing the invalid host `backend.composio.dev.1`.

The canonical endpoint is now constructed directly as `https://backend.composio.dev/api/v3.1/tools/execute/proxy`. No provider API version may be derived by substring replacement.

The failed attempt was proven pre-provider with `possible_provider_side_effect=false`, so the same daily Instagram claim is resumable and no duplicate publication is permitted.
