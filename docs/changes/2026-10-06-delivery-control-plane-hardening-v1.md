# Delivery control-plane hardening v1 — 2026-10-06

## Problem
Critical pull-request gates fetched full Git history and every remote ref, repository-writer verification could synchronously poll for six minutes, missing exact-head Required runs had no bounded recovery owner, and explicitly retired/superseded pull requests accumulated as control-plane debt.

## Structural fix
- Delivery Hygiene, Required preflight and Skill Projection use shallow checkout and only exact base/head state required for proof.
- Repository Writer Operational Verification limits synchronous candidate materialization polling to 30 seconds and emits a resumable WAITING_EXTERNAL state.
- Powerhouse Delivery Supervisor runs as one bounded recovery owner. It dispatches Required only when the exact open-PR head has no Required run after a grace period.
- The same supervisor closes only explicit RETIRED / Terminal-State: SUPERSEDED candidates or an exact same-Obligation-ID predecessor named by Supersedes.
- Per-cycle dispatch and close budgets prevent recovery fan-out.

Security, exact-SHA identity, branch protection and provider/readback gates remain fail-closed.
