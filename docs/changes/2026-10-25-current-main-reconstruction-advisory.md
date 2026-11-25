# Owner-safe current-main reconstruction

## Motivation
Repeatedly updating old delivery branches allows main drift and exact-head checks to become stale. Existing writer leases and shared System Map inventory prevent reckless auto-rebases.

## Changes
Provide a pure deterministic planner and regression tests; add a discoverable agent skill; consume existing Repository Janitor GitHub comparison evidence and emit a read-only advisory artifact without introducing a scheduler or mutating PR branches.

## Controls
Respect single-writer leases, human draft decisions, protected main and canonical System Map ownership. Verify source-driven inventory with `node scripts/brain/portal-explanation-inventory.mjs --write` and `--check` on the authoritative integration tree. Run exact-head Required, BRAIN and CodeQL, then protected merge and provider production readback. Current implementation is advisory, not an autonomous push/merge executor.
