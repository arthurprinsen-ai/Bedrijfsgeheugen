# 2026-09-24 — Exact production artifact refresh

- Fingerprint: `exact-production-artifact-refresh-20260924-v1`
- PR: #2754
- Base SHA: `5e8ef4b75f08b2d9c918cd97f13594be33ddbfa6`
- Scope: production recovery
- Root cause: beschikbare source artifact liep achter op actuele protected main.
- Change: operationele marker in canonical Production Source Snapshot om een nieuw exact artifact te genereren.
- Prevention: nooit recovery deployen vanaf een stale artifact zonder nieuwe canonical snapshot.
- Terminal state: pending provider deploy + exact SHA + browser readback.
