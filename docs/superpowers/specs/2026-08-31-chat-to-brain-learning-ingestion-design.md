# Chat-to-Brain Learning Ingestion Design

## Status
Approved in chat on 2026-08-31. Implementation is compatibility-first: reuse the existing ACTIVE `brain/policies/chat-to-brain-completeness-v1.json` pipeline rather than create a second memory system.

## Goal
Every durable material learning from a chat, agent run or operational investigation must be normalized into the canonical Bedrijfsgeheugen Brain, deduplicated by semantic fingerprint, made available to future preflight/runtime consumers, and kept open as an obligation when runtime projection cannot yet be proven.

## Canonical architecture

```text
chat / agent run / operational evidence
  -> materiality
  -> fingerprint + dedupe
  -> normalized Brain learning/blocker/obligation record
  -> existing chat-to-brain completeness policy
  -> recursive linked_learning_sources
  -> compiled agent preflight
  -> BG167/BG168 runtime projection when executable
```

The existing Brain is the source of truth. Chat history, local memory and runtime projections are inputs or projections, never competing authorities.

## Required durable fields
A material learning record carries, where applicable: `fingerprint`, `type`, `status/state`, `scope`, `symptom`, `rootCause`, `failedApproach`, `provenFix` or `requiredAction`, `prevention`, `regressionContract`, `owner`, bounded `evidence`, `openObligations`, provenance and a security classification proving that secrets, credentials and PII were excluded.

## Materiality and privacy
Persist recurring errors/root causes, proven fixes, failed approaches, architecture invariants, production/runtime evidence, cost/performance/security learnings, recovery patterns, connector semantics, ownership/dedupe/concurrency rules and operational opportunities that materially improve future execution. Do not persist raw complete conversations, credentials, tokens, cookies, session data, sensitive personal information, greetings or irrelevant prose.

## Dedupe and maturity
Fingerprints are semantic and timestamp-independent. Existing canonical learnings are reused instead of duplicated. New evidence augments the existing semantic record or creates a bounded linked record only when it represents a distinct operational obligation. Maturity remains `MEMORY -> GUARDED -> PROVEN`; Git persistence alone does not prove an external runtime projection.

## Completion rule
No chat/run/agent task is fully complete while a material learning exists only in conversation text, a reusable record lacks actionable cause/fix knowledge, a material obligation remains silently open, or a feasible prevention regression is absent. A proven hard boundary may stop execution without claiming green.

## Existing components reused
- `brain/policies/chat-to-brain-completeness-v1.json` remains the canonical ingestion/completion policy.
- `scripts/brain/chat-learning-preflight.mjs` remains the compiler and recursively follows `linked_learning_sources`.
- `config/chat-learning-completeness-guard.json` remains the fail-closed completion guard.
- BG167/BG168/BG166 remain runtime/current-context/writeback components; optional learning transport never owns the primary business result.
- BRAIN-DELIVERY-v2 and BG169 remain delivery/promotion governance.

## Current-session backfill
Existing records such as Make scenario activity ambiguity and repeated-known-blocker state are reused, not copied. The missing operational record is the canonical BG168 -> BG166 Brain writeback blocker created when Make capacity prevents execution. It links to existing capacity knowledge, preserves exact-once replay after recovery with fingerprint dedupe, forbids repeated unchanged retries and autonomous paid-capacity increases, and remains open until execution plus BG166/shared-context readback proves runtime persistence.

## Verification
Acceptance requires a real RED for the missing record, canonical persistence, recursive preflight visibility, existing Brain regression success, exact-head moving-main verification, main readback after merge, and explicit separation between repository-side Brain persistence and still-unproven Make runtime projection.
