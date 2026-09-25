# 2026-09-25 — main push fan-out budget

Observed after PR single-flight rollout: main still generated multiple independent push workflows and deployment/readback pressure for closure-only merges. Recovery scopes post-merge execution to affected domains while preserving universal Main Write Integrity and production delivery for mixed/runtime changes.
