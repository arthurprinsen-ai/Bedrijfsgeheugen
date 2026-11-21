# 2026-10-28 — Traffic quality views

- Canonical obligation: `data|growth|traffic-quality-view|20261028-v1`.
- Defect: growth metrics count unflagged bot traffic as human visits.
- Scope: one migration with two read-only views, one static guard test, learning and change documentation.
- No table, cron, edge function or consumer is changed.
- Required next proofs: exact-head Required/CodeQL/Supabase preview, protected merge, protected migration apply with version registration, readback of class counts.
- This is a measurement aid, not evidence of more visitors.
