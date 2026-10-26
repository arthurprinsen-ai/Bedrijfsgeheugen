# 2026-10-08 — Google Vertex provider integration

- Obligation: attested-vertex-regional-runtime-20261008-v1
- Reused: signed runtime gateway, trusted server provider registry, customer-consent and cross-domain CSRD approval checks.
- Added: server-pinned Google Vertex EU/US generateContent adapter and regression for cross-region/SSRF/safety/no-fallback.
- No live customer account was provisioned, and no application secrets are committed.
- Runtime activation: BLOCKED until provider credentials/region/model readback, explicit consent and authenticated tenant production evidence are independently verified.
