# 2026-09-28 — Powerhouse System Map governance

Fingerprint: `powerhouse|system-map|same-lineage-auto-writeback|v1`

Material outcome: CONTRACT_CHANGE

Implemented:
- dedicated System Map governance skill;
- canonical human architecture document;
- machine-readable governance contract in the System Map;
- regression test;
- inherited requirement for all current/future chats and agents to update topology and relations in the same lineage.

Terminal invariant: a material structural change with stale System Map state is `SYSTEM_MAP_WRITEBACK_INCOMPLETE`, not terminal green.
