# 2026-09-29 — LinkedIn Sales bounded prep v1

Incident: production dispatcher returned 503 on preparation timeout.

Fix lineage: measured population size → isolated slow person-intelligence view → added failing regression test → replaced population-first prep with bounded candidate-first prep → applied production migration → successful runtime readback.

No change to daily comment cap, cooldown, anti-pitch guardrails, DM capability truth or e-mail fallback.
