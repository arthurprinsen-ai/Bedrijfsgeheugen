---
name: powerhouse-current-main-reconstruction
description: Use for branch drift, SYSTEM_MAP_WRITEBACK_INCOMPLETE, stale PR recovery and autonomous delivery reconciliation.
---

# Current Main Reconstruction — agent contract

Fingerprint: `delivery|current-main-reconstruction|single-writer-fail-closed|20261025-v1`.

## Mandatory procedure
1. Resolve protected `main` SHA and latest PR head SHA from GitHub provider evidence; compute ahead/behind afresh, never copy an old count.
2. Read `Writer-Lease-Owner`, `Change-Scope`, predecessor/supersedes links and draft state. One obligation has one active writer. Never create a competing successor to an existing current-main successor.
3. Before any write, consult `tools/delivery/current-main-reconstruction.mjs`. `OWNER_HANDOFF` is a hard stop, not permission to mutate another agent's branch. Proposals are not completed actions.
4. For authorized same-owner non-draft candidates: reconstruct the original scoped source delta atop an exact observed main SHA; preserve main changes; do not force push, bypass conflicts or silently change semantic code. Any scope overlap goes to the original owner.
5. Because the Portal Explanation inventory hashes workflows, skills, agents, functions and portal assets, regenerate **after** all changed files using `node scripts/brain/portal-explanation-inventory.mjs --write`; inspect the semantic System Map diff with its canonical owner; enforce `--check`. Do not simply copy a SHA-256 from an older run.
6. Test exact new head with targeted regressions, Required, BRAIN and CodeQL. A green check on any older head is irrelevant. If main advances, repeat bounded reconciliation, not infinite retries.
7. Request protected merge only with required green head checks and authorization. Confirm new main SHA and real Netlify/Supabase/provider readback separately before claiming live.
8. Record immutable source receipts, attempted strategies, error fingerprint, root cause, lease, check run URLs, resulting SHA and prevention test in existing Brain learning and delivery ledger. Never invent results or mark unknown as green.

## Autonomy and prevention
Use existing Required Gate Watchdog, Repository Janitor and daily Self Evolution; no additional cron, queue, parallel writer, credential change, branch force push or production bypass. Prefer current-main reconstruction over endless rebases when drift repeatedly accumulates. A blocked request remains visible as `OWNER_HANDOFF`, with the minimum actionable evidence for the original owner.
Regression: `tests/delivery-current-main-reconstruction.test.mjs`.
