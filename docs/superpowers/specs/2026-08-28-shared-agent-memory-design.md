# Shared Agent Memory Design — 2026-08-28

## Goal
All Bedrijfsgeheugen agents share one operational truth across repository memory and Powerhouse Team Memory. No agent may rely on isolated chat history for known incidents, fixes or production state.

## Read path
Before material work, read in order: `AGENTS.md` → development operating system → development ledger → self-healing agents → this design → domain regressions/tests → current Powerhouse Team Memory.

## Event model
Material outcomes use one of: `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `PRODUCTION_PROMOTION`, `PRODUCTION_ROLLBACK`, `CONTRACT_CHANGE`.

Each event carries at minimum: timestamp, component, fingerprint, owner agent, evidence, impact, current hypothesis/root cause, attempted fixes and retry count, last-known-good, candidate SHA/deploy, next safe action, verification, rollback and reusable lesson.

## Fingerprint and dedupe
- Normalize stable component/error signatures before creating a new incident.
- Reuse known fixes when fingerprint and environment match.
- If a known fix fails, record the environment/state delta before a new hypothesis.
- Never perform more than two identical retries per hypothesis without new evidence.

## Writeback
Every material outcome is written to `docs/development-ledger.md` and to Powerhouse shared learning (BG168/BG166/BG167 path). Shared context is then refreshed so future agents see the newest truth.

## Production state
The shared memory must retain exact last-known-good production SHA/deploy, candidate SHA/deploy, promotion/rollback event and protected-metric result. A red candidate never replaces the green production truth.

## Governance
CI must verify that mandatory memory documents exist and the shared-memory validation/fingerprint tests remain green. Documentation references without machine enforcement are considered incomplete governance.
