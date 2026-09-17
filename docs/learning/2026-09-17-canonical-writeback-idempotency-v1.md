# Canonical writeback idempotency v1

Date: 2026-09-17  
Fingerprint: `canonical-writeback-idempotency-v1`  
Scope: Bedrijfsgeheugen Powerhouse / learning writeback / chat-agent continuity / deduplication  
Status: CANONICAL LEARNING

## Context

The truth-closure recovery learning had already been canonically merged through PR #1922 and written into the existing Completion Supervisor. A repeated request to “borg, log, documenteer om van te leren” therefore should not create another copy of the same incident record.

The new lesson is about writeback behavior itself: canonical learning must be idempotent.

## Rule

`CANONICAL_WRITEBACK_IS_IDEMPOTENT`.

Before creating any new learning, incident document, known-error entry or obligation, the agent must first search the current canonical Powerhouse for the same semantic fingerprint, learning id, root cause and remediation owner.

If the requested knowledge is already present and no new evidence exists, the correct action is a verified no-op/readback confirmation. If new evidence exists, append or reconcile that evidence into the existing lineage. Only a genuinely new semantic lesson gets a new learning record.

## Why this matters

Without this rule, repeated writeback requests can produce:

- duplicate learning records for the same incident;
- conflicting fingerprints or owners;
- redundant CI and repository mutations;
- unnecessary platform cost;
- ambiguity about which record is canonical;
- agents learning from stale or competing copies.

## Mandatory preflight

1. Resolve the semantic fingerprint from the request.
2. Search `brain/learning/` for matching incident/fingerprint/learning id.
3. Search `docs/learning/` and known-error contracts for matching semantics.
4. Read protected `main` identity before repository mutation.
5. When tied to a runtime obligation, read the existing canonical obligation/evidence first.
6. Compare the proposed writeback with existing semantics before deciding create vs append vs no-op.

## Decision model

- **Same semantics, no new evidence:** no mutation; return readback proof.
- **Same semantics, new evidence:** append/reconcile into the existing canonical lineage.
- **New semantics:** create exactly one new canonical learning linked to the existing source learning and owner.
- **Existing root-cause owner:** never create a second obligation merely because a new chat requested the same borging.

## Permanent prevention rules

- `CANONICAL_WRITEBACK_IS_IDEMPOTENT`
- `REPEATED_BORG_REQUEST_REUSES_EXISTING_LEARNING_LINEAGE`
- `NO_DUPLICATE_LEARNING_RECORD_FOR_SAME_SEMANTIC_FINGERPRINT`
- `APPEND_NEW_EVIDENCE_INSTEAD_OF_RECREATING_CANONICAL_TRUTH`
- `NO_NEW_OBLIGATION_WHEN_EXISTING_CANONICAL_OWNER_ALREADY_COVERS_THE_ROOT_CAUSE`
- `READBACK_BEFORE_WRITEBACK`
- `NOOP_IS_VALID_WHEN_CANONICAL_STATE_ALREADY_MATCHES_REQUEST`

## Proven example

The source truth-closure recovery learning already existed at:

- `brain/learning/powerhouse-canonical-truth-closure-recovery-2026-09-17.json`;
- `docs/learning/2026-09-17-powerhouse-canonical-truth-closure-recovery-v1.md`;
- protected merge PR #1922 / `b7dca799e3630de6dada6eb3a5183bedbfb93123`;
- existing `completion-supervisor-v1`, version 7 after the previous canonical writeback.

This learning does not duplicate that incident. It adds one new behavioral rule for future chats/agents: detect existing canonical learning first and make writeback idempotent.
