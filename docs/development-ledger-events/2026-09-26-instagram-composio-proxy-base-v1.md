# 2026-09-26 — Instagram Composio proxy endpoint recovery

Fingerprint: `instagram-composio-proxy-base-v1`.

Observed: malformed proxy URL `https://backend.composio.dev.1/api/v3.1/tools/execute/proxy`.

Fix: direct canonical v3.1 proxy construction; no string replacement. Provider-side-effect evidence was false, so the same daily claim remains the only permitted recovery lineage.
