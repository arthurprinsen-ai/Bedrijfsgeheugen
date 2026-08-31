# Chat-to-Brain Learning Ingestion Design

## Status
Approved in chat on 2026-08-31 for implementation planning. This document is the canonical design for moving durable learning from conversations/runs into the Bedrijfsgeheugen Brain instead of leaving it only in chat context.

## Problem
Durable lessons can currently exist in conversation context, chat checkpoints, GitHub guards, Make/Notion operational records, or runtime evidence without a single guaranteed ingestion path into the Brain. Existing completeness checks already reject some chat-only learning, but coverage is not universal. This creates three failure modes:

1. a future agent can miss a known root cause or proven fix;
2. duplicate analysis/fixes can be repeated because fingerprints are not promoted into shared runtime memory;
3. completion can be claimed while material learning remains only in conversation text.

The system must treat chat as an input surface, never as the canonical long-term source of truth.

## Goal
Create one governed Chat → Brain Learning Ingestion pipeline that converts every material durable learning from chats and agent runs into a canonical, deduplicated, machine-readable Brain record, makes it available to future agent preflight/runtime retrieval, and blocks completion while material learnings remain chat-only.

## Non-goals
- Do not persist raw complete conversations as canonical Brain knowledge.
- Do not store credentials, secrets, authentication material, personal/sensitive user data, or irrelevant conversational text.
- Do not create a second competing memory system beside the existing Brain/BG167/BG168/shared-agent-memory architecture.
- Do not auto-purchase Make capacity or perform irreversible external mutations merely to prove learning promotion.

## Canonical Architecture

```text
chat / agent run / operational evidence
        |
        v
materiality classifier
        |
        +-- non-material --> no durable write
        |
        v
learning normalizer
        |
        v
fingerprint + dedupe + causal-chain validation
        |
        v
canonical Brain Learning Ledger
        |
        +--> guard/regression registry
        +--> delivery/agent preflight actionable knowledge
        +--> BG167/BG168/runtime shared memory projection
        +--> open outcome/recovery obligations
        |
        v
outcome evidence / independent recurrence evidence
        |
        v
MEMORY -> GUARDED -> PROVEN
```

The canonical Brain Learning Ledger is the source of truth. Runtime projections and chat checkpoints are derived/operational views, not competing authorities.

## LearningRecord v1
Every durable material learning must normalize to a single schema containing:

- `fingerprint`: stable semantic identity used for dedupe/reuse;
- `scope`: technical/operational/security/cost/performance/SEO/market/recovery/production/governance/etc.;
- `symptom`: observable failure/opportunity/state;
- `rootCause`: grounded cause, or explicit `UNKNOWN_PENDING_EVIDENCE` while the obligation remains open;
- `failedApproach`: known failed/repeated approach when applicable;
- `fix`: proven fix or safe containment;
- `preventionRule`: machine-readable prevention invariant;
- `regressionContract`: executable regression/evidence contract when feasible;
- `owner`: one canonical remediation/learning owner;
- `evidence`: references to exact execution/commit/PR/scenario/readback/runtime evidence;
- `stateHash` or equivalent dedupe state identity when needed;
- `openObligations`: unresolved verification/recovery/promotion obligations;
- `status`: `MEMORY`, `GUARDED`, or `PROVEN`;
- `createdAt`/`updatedAt` and source provenance;
- `safetyClass`: confirms that no secret/sensitive material is persisted.

## Materiality Rules
Persist only durable learning that can materially improve future execution. Examples include:

- recurring errors and root causes;
- proven fixes and failed approaches;
- architecture/interface invariants;
- production/runtime evidence and promotion blockers;
- cost/credit/performance optimizations;
- security and least-privilege learnings;
- self-healing/recovery patterns;
- Make/Notion/GitHub/Netlify/platform connector semantics;
- SEO/market/opportunity patterns where reuse is operationally valuable;
- agent ownership, dedupe, concurrency and delivery-governance rules.

Do not persist greetings, transient prose, credentials, secrets, raw personal data, or low-value conversation detail.

## Deduplication and Update Semantics
- Fingerprints are semantic, not timestamp-based.
- The same root cause must converge on one canonical LearningRecord.
- New evidence updates the existing record; it must not create parallel owners for the same root cause.
- Repeated identical failed attempts without new evidence are blocked by existing retry/learning guards.
- If a fingerprint exists but the new evidence materially changes the root cause or contract, preserve the audit history and update the canonical current record rather than silently overwriting provenance.

## Completion Gate
A chat/run/agent task may not report complete when:

- a material durable learning exists only in conversation text;
- a required LearningRecord lacks its causal chain;
- a known reusable fingerprint is not available to preflight/runtime agent knowledge;
- a material open obligation is not terminal or explicitly proven as a hard boundary;
- a prevention guard exists without executable discovery/coverage where such coverage is feasible.

A successful no-op is allowed when the materiality classifier proves that no durable learning was produced.

## Agent Consumption
Before material work, agents must receive reusable knowledge, not only fingerprint names. For every reused guard/learning, preflight must expose at least:

- fingerprint;
- root cause;
- proven fix or safe containment;
- prevention rule when one exists;
- regression/evidence contract when available;
- owner/status/open obligations relevant to the current task.

Missing actionable knowledge is fail-closed.

## BG167/BG168 Integration
Existing BG167/BG168/shared-memory components remain part of the architecture:

- canonical Brain records are the governed persistent source;
- BG167/BG168/runtime projections expose the needed subset to agents;
- optional learning transport must never suppress the primary business result;
- materiality must be decided before paid downstream dispatch where possible;
- Make capacity exhaustion is a hard boundary, not authorization to claim success or buy capacity automatically;
- writeback requires execution/readback evidence before a record is treated as fully persisted through that runtime path.

## Backfill
The first implementation must compare recent Powerhouse/Make/CI/CD/Chrome/agent chat learnings with canonical Brain records and create/update missing durable records. Known candidates include, but are not limited to:

- `MAKE_SCENARIO_ACTIVITY_STATE_AMBIGUOUS` / single-field Make activity-state ambiguity;
- `repeated-known-blocker-no-state-v1` or the canonical equivalent for repeated execution against a known unchanged blocker;
- browser/candidate-Chrome runtime learnings already guarded in GitHub;
- Make team/org paused capacity boundary and exact replay obligation;
- shared CI hotspot/guard discovery/schema-overmatch/preflight-actionable-knowledge learnings;
- connector mutation safety and exact readback requirements.

Backfill must dedupe against existing fingerprints and may not create parallel canonical records for the same semantic root cause.

## Safety and Privacy
- Never persist credentials, tokens, passwords, cookies, session data or secret connector payloads.
- Do not persist sensitive personal user information into the company Brain merely because it appeared in a chat.
- Persist bounded evidence references and normalized operational learning instead of raw conversation dumps.
- Mutating connector capability discovery must remain prohibited; use read-only discovery first and exact readback after writes.

## Failure Handling
- If the Brain writeback transport is unavailable, preserve the normalized LearningRecord as an open outcome obligation and do not claim full Brain persistence.
- Retry only when state/evidence has changed; do not burn credits on repeated known blockers.
- If Make is paused by operations/data-transfer limits, preserve the writeback payload and replay exactly once after capacity recovers, using fingerprint dedupe.
- If canonical persistence succeeds but runtime projection fails, the record remains durable but the projection obligation stays open.

## Verification Strategy
Implementation is accepted only when all of the following are proven:

1. TDD RED demonstrates that a material chat-only learning blocks completion.
2. A normalized LearningRecord is persisted into the canonical Brain layer.
3. Duplicate input updates/reuses one semantic fingerprint rather than producing duplicates.
4. Preflight exposes actionable knowledge for the persisted record.
5. Existing guard-family CI automatically executes the new regressions or a dedicated equivalent workflow is used without creating a shared-CI hotspot.
6. Moving-main/file/semantic conflict gates remain green for the exact candidate SHA.
7. Main readback confirms the canonical artifacts after merge.
8. Runtime/BG167/BG168 promotion is labeled accurately: Git persistence alone is not proof of runtime projection when Make is capacity-blocked.

## Success Criteria
The design is successful when a future agent can encounter a previously seen class of problem and automatically retrieve the canonical root cause, proven fix, prevention rule and current obligations before execution, without depending on the original chat being open or on a human remembering the prior solution.
