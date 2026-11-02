---
name: powerhouse-post-merge-codeql
description: Use whenever CodeQL or another post-merge security workflow is queued, running, superseded, cancelled, or completing on main during Bedrijfsgeheugen delivery.
---

# Powerhouse Post-Merge CodeQL

Fingerprint: `delivery|post-merge-codeql|single-flight-terminality|v1`.

A post-merge CodeQL status is internal execution state, never a user handoff.

- Bind verification to the exact authoritative commit SHA.
- Use stable PR/ref concurrency; never `github.run_id`.
- Newer same-ref runs supersede stale work.
- Only the newest relevant exact-SHA run decides security terminality.
- Do not end with “CodeQL still running” or equivalent.
- Required failures stay on the same obligation lineage until repaired and re-proved.
- If path filters make CodeQL inapplicable, record `SECURITY_NOT_APPLICABLE` from configuration evidence.
- LIVE_BEWEZEN still requires exact-main production/provider readback.

Valid terminal security states: `SECURITY_GREEN`, `SECURITY_NOT_APPLICABLE`, or evidenced `BLOCKED_HARD_BOUNDARY`.

## Client transport continuation

A client-side response transport interruption is non-terminal delivery state. On the next executable turn, resume the existing canonical branch/PR, re-read current main and exact workflow state, and continue to the normal terminal contract. Do not create a replacement lineage solely because the response channel ended.

## 2026-11-02 — recurring exact-head BRAIN terminal handoff

CodeQL success alone cannot close a merged PR obligation. Original terminal PR #5246 failed with `TERMINAL_CRITICAL_GATE_NOT_TERMINAL:BRAIN` despite Required/CodeQL success, because no exact candidate `unified-brain-delivery.yml` workflow_dispatch had completed. The existing trusted `obligation-terminal-closure.yml` must request exactly one preflight `verification_only=true` BRAIN dispatch for a merged, same-repository PR with verified original head/merge SHA and protected main ancestry, unless that exact run already exists. Recheck run title and protected workflow-source commit. A previous run that failed is not a reason to create an endless retry loop. The original BRAIN workflow cannot hand off BG169 production in verify-only mode. Existing final required gate remains fail-closed: BRAIN, runtime provider readback, next natural execution and independently proven customer outcome remain separate. Record recurrence in the existing ONE BRAIN fingerprint `powerhouse|terminal|exact-head-unified-brain-run-missing|20261029-v1`, with original owner, regression and prevention. Never create a new scheduler or parallel terminal executor.

## 2026-11-02 — independent full BRAIN backend debt after CodeQL/Required green

Original protected PR #5250 merged, then exact-head BRAIN run `41406918918` failed its backend lane: **34 failing assertions from 30 test files**; independent portal/automation lanes passed. Original terminal `41406888278` failed as it should. Never mark `SECURITY_GREEN` or `Required SUCCESS` as full BRAIN/terminal close. Persist source list and exact failed job in original ONE BRAIN fingerprint `powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1`, assign to original source owners and repair each root cause with historical replay. A compliant existing skill must immediately leave the incident-protocol debt baseline; the admin portal `app.js` version must match the generated System Map digest to prevent old UI being cached. Do not change provider migration locks, history counts, portal security, test expectations, or direct publishing merely to get a green CI badge. Preserve non-terminal failures, never add parallel scheduler/publisher. One owner-only Portal card must show actual backend failure count and explicit `verifiedPassed=false`; only original successful BRAIN + terminal and independent provider readback may close the loop.
