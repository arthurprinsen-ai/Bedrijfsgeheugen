# Repository hygiene control plane — activity ledger

- Date: 2026-09-19
- Obligation-ID: repository-hygiene-control-plane-v1
- Delivery lane: automation
- Candidate: PR #2326
- Goal: reduce repository branch/PR hygiene debt without deleting unique or active work.
- Change: added deterministic candidate supersession rules, fail-closed orphan writer-branch cleanup, daily audit, explicit apply mode, evidence artifact, tests, and learning writeback.
- Safety invariant: a branch is only auto-deleted when it is in a controlled writer namespace, is not an open PR head, is not protected, and GitHub compare proves ahead_by=0.
- Current delivery state: exact-head CI required; no terminal LIVE claim until protected merge and main readback.
