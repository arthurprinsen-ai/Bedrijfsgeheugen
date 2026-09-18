# 2026-09-18 — Material writeback closure enforcement

Fingerprint: `powerhouse|material-run|closure-artifacts|required|v1`

## Incident
The canonical agent/chat contract already required logging, documentation, learning writeback and next-agent discoverability, but material candidates could still pass Required without carrying those durable artifacts.

## Root cause
The regression suite primarily proved that policy and skill text existed. It did not inspect the candidate diff and require concrete closure artifacts before release lanes started.

## Change
Added `scripts/brain/material-writeback-closure-guard.mjs` and wired it into Required preflight. Material changes now require Brain learning, an append-only activity/development-ledger event, and human-readable change/learning documentation in the same candidate.

## Learning
Policy text is not enforcement. Any Definition-of-Done invariant that can be determined from repository state must be represented as executable CI logic.
