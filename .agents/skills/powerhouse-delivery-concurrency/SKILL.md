---
name: powerhouse-delivery-concurrency
description: Use for GitHub delivery when multiple chats, agents, workflows or writers can move main concurrently or race at protected merge.
---

# Powerhouse Delivery Concurrency

Fingerprint: `delivery|merge-epoch|optimistic-cas|v1`.

## Goal

Keep development parallel, but make terminal landing deterministic. Main may move at any time. A green gate on an older main epoch is never enough by itself to authorize a protected merge.

## Mandatory protocol

1. Work in parallel while scopes do not conflict.
2. Before terminal merge, acquire one short-lived landing lease bound to:
   - obligation;
   - exact candidate head SHA;
   - exact current main SHA.
3. Re-read current main immediately before merge.
4. Require candidate head = tested head.
5. Require `behind_by = 0` for the landing candidate.
6. Require GitHub to report no merge conflict.
7. Require the landing lease to still match the same candidate head and main SHA.
8. If main moved after the gate, do not merge. Reconcile onto current main, preserve the full current-main union, rerun the required exact-head gates, then reacquire the landing lease.
9. Protected merge must use expected-head/CAS semantics. A failed CAS or conflict is recovery input, never a terminal failure.
10. After merge, continue through production readback, outcome evidence, learning writeback and skill projection.

## Parallel-agent rules

- One active executable candidate per obligation.
- Duplicate same-obligation PRs are superseded/closed; they never race independently.
- Integration is serialized only for the short terminal landing window, not for development.
- Non-overlapping agents keep working while another candidate owns the landing lease.
- Overlap is determined from changed paths, contracts, dependencies and mutable external resources.
- Main drift without terminal intent is informational; main drift during landing invalidates the landing proof.
- Never keep a stale green result authoritative after the main epoch changed.

## Prediction and prevention signals

Treat these as leading indicators before a conflict occurs:

- rising `behind_by`;
- more than one TERMINAL_DELIVERY candidate;
- duplicate Obligation-ID across open PRs;
- merge-base older than the gate main SHA;
- main moving during Required/BRAIN execution;
- repeated rebase/retest cycles for the same obligation;
- changed-path or contract overlap between terminal candidates.

When these signals appear, Powerhouse should prioritize the candidate closest to terminal completion, defer duplicate same-obligation writers, and serialize only the landing boundary.

## Incident rule

PR #2074 on 2026-09-18 is the reference incident: exact-head gates became green, main moved, and the candidate became 10 commits behind with a real merge conflict. The prevention rule is not “retry merge”; it is “green must be bound to a current main epoch plus a landing lease before protected merge.”


## User-facing terminal-state rule

Delivery ownership does not end when CI is queued/running, auto-merge is armed, branch protection is waiting, the merge is pending, deployment is pending, or production readback is pending. Those states are recoverable execution states inside the same canonical lineage.

The executing/recovering node must continue or resume until one of these is evidenced: `LIVE_BEWEZEN`, `ROLLED_BACK_GREEN`, or `BLOCKED_HARD_BOUNDARY`. Intermediate progress may be reported, but it may not transfer responsibility back to the user or require a “continue” prompt.

Canonical fingerprint: `delivery|no-pending-final-output|v1`.
Canonical authority: `brain/policies/powerhouse-agent-continuity-v1.json`.


## Borging closure invariant

Borging is not post-processing. When a delivery creates a canonical learning/prevention rule, the same lineage owns its durable writeback into the relevant documentation and skills and must prove that writeback on current main before terminal completion. A merged implementation with stale learning/skill surfaces is non-terminal.

Fingerprint: `delivery|borging-closure|material-writeback|v1`.

## Canonical connector/toolchain authority

Before choosing an external execution route, apply `powerhouse|toolchain-authority|composio-no-make|v1` from `.agents/skills/powerhouse-toolchain-authority/SKILL.md`.

Make is retired and forbidden as execution, orchestration, fallback or recovery. Use the canonical active stack instead: Composio where orchestration is needed; GitHub, Netlify, Notion, Supabase, Tavily, Buffer, DataForSEO, OpenArt, Placid, Google Search and Google Analytics for their specialist capabilities. Historical Make references are provenance only and must never reactivate authority.
