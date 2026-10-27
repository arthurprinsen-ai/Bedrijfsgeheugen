# 2026-09-29 — Growth Swarm bounded refresh v1

Production incident: hourly commercial governor timed out inside Growth Swarm.

Root cause: population-first intelligence fanout before candidate pruning.

Fix: candidate-first company set, candidate-scoped person enrichment, preserved commercial gates and outcome lineage.

Evidence:
- supabase/migrations/20260929165000_growth_swarm_bounded_refresh_v1.sql
- tests/brain-growth-swarm-bounded-refresh-v1.test.mjs
- brain/learning/2026-09-29-growth-swarm-bounded-refresh-v1.json
