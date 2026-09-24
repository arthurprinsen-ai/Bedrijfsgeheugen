# 2026-09-24 — Exact production artifact refresh

- Fingerprint: `exact-production-artifact-refresh-20260924-v1`
- PR: #2754
- Base SHA: `5e8ef4b75f08b2d9c918cd97f13594be33ddbfa6`
- Scope: production recovery
- Root cause: beschikbare source artifact liep achter op actuele protected main.
- Change: operationele marker in canonical Production Source Snapshot om een nieuw exact artifact te genereren.
- Prevention: nooit recovery deployen vanaf een stale artifact zonder nieuwe canonical snapshot.
- Terminal state: pending provider deploy + exact SHA + browser readback.

- Follow-up: production snapshot retriggered after pricing parse fix merge `e223851136669000f1f58b6b1dadfe9e2f2adcc1` because readback started without snapshot.

- Follow-up: Problem Radar executive P0 merged in PR #2779; production was still on `be5ec08e69600acfdba31b28af0d6736c84917d6`, so canonical Production Source Snapshot is retriggered for exact-current-main deployment and readback.
