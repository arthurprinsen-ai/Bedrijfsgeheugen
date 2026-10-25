# GitHub CI hygiene recovery — 25 October 2026

## Purpose
Reuse the canonical Repository Janitor and Recovery Supervisor instead of adding competing schedulers. Consolidate safe retired PR cleanup, CI throughput analysis and exact-head release checks in a reusable agent skill inherited by AGENTS.md.

## Incident and fix
PR #4943 originally failed admission because PR metadata lacked Base-SHA. After that metadata was repaired, Required rejected the candidate because its activity ledger, Brain learning and human-readable change documentation were absent. This candidate adds these mandatory records; it does not weaken the admission guard.

## Evidence boundary
CodeQL passed for initial head 9cca3a27b36841457cad93969ef0a7b196861a1f. New commits invalidate that earlier exact-head evidence. Required/BRAIN/CodeQL, protected merge and production readback must be reassessed. No measured CI speedup, production deployment or agent-runtime inheritance is asserted.
