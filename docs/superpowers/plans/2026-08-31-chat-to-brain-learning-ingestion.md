# Chat-to-Brain Learning Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backfill the current durable chat learning into the existing canonical Bedrijfsgeheugen Brain and prove that every subsequent agent preflight receives it without creating a second memory system.

**Architecture:** Reuse the ACTIVE `chat-to-brain-completeness-v1` policy and its recursive `linked_learning_sources`. Add one bounded current-session learning shard for the still-missing Brain-writeback replay obligation, link it from the policy, and verify it through the existing compiled preflight. Existing semantically equivalent learnings are referenced/deduplicated rather than copied.

**Tech Stack:** Node.js 22 test runner, JSON Brain records, GitHub Actions, BRAIN-DELIVERY-v2.

**Spec:** `docs/superpowers/specs/2026-08-31-chat-to-brain-learning-ingestion-design.md`

## Global Constraints
- One canonical Brain only; no parallel chat-memory authority.
- Never persist secrets, credentials, tokens, cookies, session data or PII.
- Do not infer Make runtime persistence from Git persistence.
- No paid-capacity increase or blind Make retry.
- TDD RED before implementation.
- Candidate-only writes; exact-head BRAIN verification and fresh current-main conflict check before merge.

---

### Task 1: RED — require current-session Brain writeback learning in effective preflight

**Files:**
- Modify: `tests/chat-to-brain-completeness.test.mjs`

**Interfaces:**
- Consumes: `compileChatLearningPreflight({ rootDir })`.
- Produces: regression that requires `brain/learning/chat-session-brain-writeback-2026-08-31.json` and fingerprint `brain-writeback|bg168-bg166|make-capacity-paused-pending-replay-v1` in the effective packet.

- [ ] Add a test asserting the source path and fingerprint are present in `packet.sources`/`packet.fingerprints`.
- [ ] Commit only the failing regression.
- [ ] Open the PR and verify Shared Agent Memory or the relevant BRAIN test lane fails for the expected missing source/fingerprint reason.

### Task 2: GREEN — persist the missing operational learning without duplicating generic capacity knowledge

**Files:**
- Create: `brain/learning/chat-session-brain-writeback-2026-08-31.json`
- Modify: `brain/policies/chat-to-brain-completeness-v1.json`

**Interfaces:**
- Produces canonical record fingerprint `brain-writeback|bg168-bg166|make-capacity-paused-pending-replay-v1`.
- Links to existing general capacity failures rather than replacing them.
- Exposes the new shard through recursive `linked_learning_sources`.

- [ ] Create one `OutcomeObligation`/learning record containing symptom, root cause, failed approach, safe containment, prevention, owner, evidence class, open obligation and security classification.
- [ ] Record `relatedFailureFingerprints` including the existing Make capacity hard-boundary fingerprint(s).
- [ ] Specify exact-once replay after capacity/tool recovery, fingerprint dedupe, and no autonomous paid-capacity increase.
- [ ] Add the shard to `chat-to-brain-completeness-v1.json.linked_learning_sources` without changing the policy architecture.
- [ ] Verify no duplicate record is created for `MAKE_SCENARIO_ACTIVITY_STATE_AMBIGUOUS` or `repeated-known-blocker-no-state-v1`; those remain canonical in their current shards.

### Task 3: GREEN — prove effective preflight and privacy boundaries

**Files:**
- Modify: `tests/chat-to-brain-completeness.test.mjs` only if an additional assertion is needed; prefer no production change.

**Interfaces:**
- `compileChatLearningPreflight()` must recursively discover the new linked source.

- [ ] Verify the original RED test now passes.
- [ ] Assert the shard declares no secrets, credentials or PII.
- [ ] Assert the obligation remains non-PROVEN for Make runtime projection until independent execution/readback evidence exists.
- [ ] Run the complete Shared Agent Memory test job and relevant BRAIN delivery lane.

### Task 4: Delivery and main readback

**Files:** none unless a genuine integration failure demands a TDD fix.

- [ ] Confirm exact PR head SHA and green BRAIN plan/lane/handoff evidence.
- [ ] Refresh `main` immediately before merge and inspect changed-path/contract overlap.
- [ ] If overlapping main drift exists, supersede and rebuild from current main; otherwise preserve the exact tested candidate.
- [ ] Merge only through the governed exact-head path.
- [ ] Read back `main`: spec, learning shard, policy link and regression test.
- [ ] Verify the push-to-main Shared Agent Memory run is green.
- [ ] Report canonical Git/Brain persistence separately from Make/BG167/BG168 runtime projection; keep runtime replay obligation OPEN until independently proven.
