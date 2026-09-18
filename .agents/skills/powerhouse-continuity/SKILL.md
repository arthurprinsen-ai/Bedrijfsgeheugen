---
name: powerhouse-continuity
description: Use when materially operating, changing, debugging, recovering, documenting, or handing off Bedrijfsgeheugen Powerhouse work across chats, agents, workflows, repositories, providers, or interrupted execution.
---

# Powerhouse Continuity

## Core principle

Every material chat or agent is an intrinsic execution node in one canonical Powerhouse loop. Local chat state is never authority.

The canonical contract is `brain/policies/powerhouse-agent-continuity-v1.json`.

## Required behavior

Before material work:
- enforce `CURRENT_STATE_BEFORE_WORK`;
- enforce `REUSE_BEFORE_BUILD`;
- enforce `NO_AGENT_STARTS_FROM_SCRATCH`;
- read current truth, open obligations, relevant learning and the existing delivery lineage;
- compute only the missing delta.

During execution:
- stay on one canonical obligation/candidate lineage;
- repair root causes, not symptoms;
- never create a parallel brain, truth store, queue, PR or replacement workflow when the existing canonical route can continue;
- preserve exact-head identity, idempotency and security/truth gates.

Before terminal completion:
- prove the relevant tests/gates;
- merge/deploy/promote where applicable;
- read back production/provider truth;
- record outcome/value, root cause, regression and prevention;
- complete canonical writeback so the next run resumes from the written state.

`LIVE & BEWEZEN` requires evidence. Code, commit, PR, deploy-start, queued CI, timeout or chat/model stop are not completion.

## Recovery

Unexpected interruption means recovery, not restart. Resume from the last verified checkpoint and reconcile already-proven side effects before mutating again.

## Quick reference

| Situation | Required action |
|---|---|
| Existing knowledge or prior fix | Reuse it first |
| Search returns nothing | Treat as unknown, not proof of absence |
| CI fails | Read the first concrete failing assertion and fix only that cause |
| Main moves | Reconcile on the same lineage; re-prove exact head |
| Production/provider action | Read back the exact result |
| New learning | Write it canonically and make it discoverable |

## Common mistakes

- Treating chat memory as the source of truth.
- Starting a fresh design because prior state was not immediately visible.
- Calling a change done at commit/PR/deploy-start.
- Adding a regression that required CI never executes.
- Recording a fix without the reusable prevention rule.

## Canonical references

- `brain/policies/powerhouse-agent-continuity-v1.json`
- `brain/learning/chat-agent-intrinsic-loop-node-2026-09-18.json`
- `docs/brain/chat-agent-intrinsic-loop-node.md`
- `tests/brain-powerhouse-universal-agent-learning-writeback.test.mjs`

## External worker / connector boundary recovery

- Never treat a chat/tool safety boundary as a Powerhouse database outage without proving both separately.
- If direct ad-hoc SQL shape is rejected by the host but the canonical service-role RPC is callable, use the existing bounded RPC; never bypass atomic claim/CAS semantics with table writes.
- Provider work must be durable before dispatch: atomically claim one canonical job first, persist worker identity/attempt, then call the provider, then write back only the exact provider asset URL/metadata through the bounded completion route.
- A provider generation returning PENDING/RUNNING is a recoverable incomplete state, not failure and not completion. Persist/resume by canonical job + provider history identity; never generate a duplicate merely because a chat/run stopped.
- Provider-specific format constraints are checked before generation. If a chosen model cannot satisfy the canonical contract, switch to a compatible allowed model/provider without weakening the contract.
- Final media truth remains verifier-owned: producer/worker may never synthesize SHA, dimensions, Mira PASS, identity PASS, publication PASS, or LIVE_PROVEN.
- Historical sent items with republish_forbidden remain immutable; recovery creates no duplicate publication.
