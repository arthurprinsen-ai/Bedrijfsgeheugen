# Universal Brain Event & Retention Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the existing Powerhouse/Bedrijfsgeheugen estate into one universal evidence→graph→action→outcome→learning loop with tiered retention, without creating duplicate Brain, graph, scorer or publisher truth.

**Architecture:** Add a small universal event contract in the repository and one canonical Make ingest/router in front of existing BG205/BG168/BG156. Extend BG185 so every active producer/capability is checked for event/retention/autonomy coverage. Existing BG166/BG167, BG184/BG210, BG202, BG206/BG208 and GitHub delivery remain authoritative and are reused.

**Tech Stack:** Node.js 22 ESM tests/contracts, GitHub Actions, Make scenarios, Notion/Datahub, existing BG205/BG168/BG166/BG167/BG156/BG185 services.

**Spec:** `docs/superpowers/specs/2026-09-01-universal-brain-event-retention-loop-design.md`

## Global Constraints

- Tier 0 raw retention target: 7 days.
- Tier 1 raw retention target: 30 days.
- Tier 2 raw retention target: 180 days where privacy/security policy permits.
- Tier 3 durable learning/lineage: permanent.
- Never persist secrets, bearer tokens, passwords or API keys in durable evidence/learning.
- Deterministic classification/dedupe occurs before AI.
- BG205 remains canonical graph writer; BG168→BG166→BG167 remains canonical durable learning path.
- BG156 remains governed self-heal orchestrator; BG185 remains estate contract guardian.
- No duplicate opportunity scorer, graph, publisher state machine or Brain.
- No high-frequency estate-wide polling or autonomous paid credit/plan upgrades.
- Completion requires exact outcome/readback evidence, never configuration-save or scenario-success alone.

---

### Task 1: Universal event-envelope contract

**Files:**
- Create: `tools/universal-event-envelope.mjs`
- Create: `tests/universal-event-envelope.test.mjs`

**Interfaces:**
- Produces `normalizeUniversalEvent(input, now?)`, `fingerprintUniversalEvent(event)`, `validateUniversalEvent(event)`.
- Consumers: Make-adapter parity tests, GitHub producer checks, retention classifier.

- [ ] **Step 1: Write failing tests** covering required immutable fields, deterministic event identity, secret redaction, stable fingerprinting, and rejection of missing source/producer/type.
- [ ] **Step 2: Run** `node --test tests/universal-event-envelope.test.mjs` and verify RED.
- [ ] **Step 3: Implement minimal ESM contract** with normalized lowercase domain/source/type values, ISO timestamps, SHA-256 payload hash/fingerprint, and structural validation.
- [ ] **Step 4: Re-run** the test and verify GREEN.
- [ ] **Step 5: Commit** `feat: add universal event envelope contract`.

### Task 2: Tiered retention and privacy classifier

**Files:**
- Create: `tools/event-retention-policy.mjs`
- Create: `tests/event-retention-policy.test.mjs`

**Interfaces:**
- Produces `classifyRetention(event)` and `sanitizeEvidence(value)`.
- Returns `{retentionTier, rawRetentionDays, durable, privacyClass, sanitizedEvidence}`.

- [ ] **Step 1: Write failing tests** for heartbeat/debug→T0/7d, warning/retry→T1/30d, material incident/outcome→T2/180d, causal learning→T3/permanent, and secret-bearing evidence redaction.
- [ ] **Step 2: Run** `node --test tests/event-retention-policy.test.mjs` and verify RED.
- [ ] **Step 3: Implement deterministic policy** with security/privacy override and no AI dependency.
- [ ] **Step 4: Run both Task 1–2 tests** and verify GREEN.
- [ ] **Step 5: Commit** `feat: enforce tiered event retention policy`.

### Task 3: Repository-side closed-loop contract and delivery gate

**Files:**
- Create: `tools/universal-event-contract-check.mjs`
- Create: `tests/universal-event-contract-check.test.mjs`
- Create: `.github/workflows/universal-event-contract.yml`
- Modify: existing Brain delivery classifier/config only if required so the new files enter an existing automation/reliability lane.

**Interfaces:**
- Scans changed repository-side producers/workflows for declared event identity, evidence reference, status/outcome semantics and durable-learning obligation.
- Does not require every workflow to call Make directly; legacy producers may satisfy the contract through an explicitly registered adapter owner.

- [ ] **Step 1: Write RED tests** for an unregistered producer, a producer without retention class, and an approved legacy producer with adapter ownership.
- [ ] **Step 2: Run** `node --test tests/universal-event-contract-check.test.mjs` and verify RED.
- [ ] **Step 3: Implement checker and a small machine-readable producer registry** in the checker module or a focused JSON registry if existing repository conventions require it.
- [ ] **Step 4: Add path-scoped GitHub Action** that runs the contract test on workflow/runtime/agent changes.
- [ ] **Step 5: Run repository contract tests** and verify GREEN.
- [ ] **Step 6: Commit** `ci: enforce universal event producer contract`.

### Task 4: Extend canonical Datahub schema for event evidence

**Systems:**
- Notion/Datahub datasource `215925a2-d60e-4013-b5a3-c1f789090e1a`.

**Fields to add only when absent:**
`Event ID`, `Occurred At`, `Ingested At`, `Source System`, `Producer ID`, `Event Domain`, `Event Type`, `Severity`, `Correlation ID`, `Event Fingerprint`, `Evidence Refs`, `Payload Hash`, `Payload Class`, `Privacy Class`, `Retention Tier`, `Raw Retain Until`, `Event Cost Units`, `Event Status`, `Durable Learning Required`, `Repairable`, `Repair Owner`.

- [ ] **Step 1: Fetch current schema** and diff against the field list; do not duplicate existing equivalent fields.
- [ ] **Step 2: Add only missing properties** using Notion schema DDL.
- [ ] **Step 3: Re-fetch schema** and verify exact names/types.
- [ ] **Step 4: Record schema evidence** in the implementation notes/PR body.

### Task 5: BG211 canonical Universal Event Ingest & Lineage Router

**Systems:**
- Create Make scenario `BG 211 - Universal Event Ingest & Lineage Router v1` in team `2138086`.
- Reuse Make connection `10020785` and Notion connection `8997531`.

**Interface:**
- On-demand input: `event_json` text.
- Output: canonical status JSON.

**Flow:**
`Start → normalize/validate/sanitize/classify → find Event ID/fingerprint in Datahub → COALESCED if duplicate → persist evidence → materiality/repair classification → BG205 graph persist for material event → BG168 durable learning when required → BG156 when safely repairable and authorized → return exact state`.

- [ ] **Step 1: Discover exact Make module specs** for StartSubscenario, Code, Notion API, BasicIfElse and runScenarioWithInputs before scenario creation.
- [ ] **Step 2: Create inactive BG211** with declared input/output and deterministic modules only.
- [ ] **Step 3: Inspect module mappings** and validate all connections/filters.
- [ ] **Step 4: Activate BG211** only after configuration validation.
- [ ] **Step 5: Run one unique non-material T1 canary**; verify Datahub evidence persisted and no BG168/BG156 fanout occurred.
- [ ] **Step 6: Replay exact same event**; verify `COALESCED` and no duplicate Datahub/Brain/action write.
- [ ] **Step 7: Run one unique material-but-nonrepairable learning canary**; verify BG205 lineage and BG168→BG166 durable learning with exact readback.
- [ ] **Step 8: Commit/update operational docs only after runtime proof**.

### Task 6: BG185 estate-wide producer/autonomy enforcement

**Systems:**
- Patch existing `BG 185 - Agent Fabric Contract Guardian v1` (`7148743`), do not create a duplicate guardian.

**Contract additions:**
Every active producer/capability must have an event producer or adapter owner, immutable identity/dedupe, retention/privacy classification, safe execution boundary, readback/outcome evidence, Brain writeback/deferred obligation and cost guard.

- [ ] **Step 1: Snapshot existing BG185 blueprint and module mappings**.
- [ ] **Step 2: Add deterministic validation for the universal event/retention contract** while preserving existing PH runner checks.
- [ ] **Step 3: Route each new drift fingerprint through BG168, coalesced by producer/capability key**.
- [ ] **Step 4: Add safe routing to BG156 only for repairable governance gaps; never auto-enable/repair retired or authority-blocked components.
- [ ] **Step 5: Run one bounded guardian canary** against current inventory and verify zero duplicate component creation and exact `AUTONOMY_GAP` evidence for any uncovered producer.

### Task 7: Integrate existing Powerhouse producer families without duplicate logic

**Systems:**
- Social: BG184 → BG171/BG179.
- Blog: BG210 → BG192/BG164/BG194.
- Opportunity/content: BG202.
- Value: BG206/BG208.
- Intelligence: BG207.
- Agent closed loop: BG156.

- [ ] **Step 1: Inspect each canonical producer for existing BG168/BG205/outcome writeback**.
- [ ] **Step 2: For each producer, add the smallest adapter call to BG211 only where event evidence/retention/lineage is missing; do not duplicate an existing durable learning call.
- [ ] **Step 3: Preserve each producer's immutable idempotency key as the source `event_id` or correlation key.
- [ ] **Step 4: Run bounded canaries only on branches/paths that do not invoke paid AI/DataForSEO unless there is real due work.
- [ ] **Step 5: Verify social/blog/opportunity/value/intelligence paths still have one canonical owner and no duplicate publications/actions/learnings.

### Task 8: Repository and GitHub failure ingestion adapter

**Files/Systems:**
- Reuse `tools/delivery-learning.mjs` and Unified Brain Delivery artifacts.
- Add adapter output to the universal event envelope rather than replacing delivery-learning fingerprints.

- [ ] **Step 1: Add RED tests** that a GitHub observed failure can be losslessly transformed into the universal event envelope without changing its existing delivery fingerprint.
- [ ] **Step 2: Implement adapter function** in a focused module (prefer `tools/universal-event-adapters.mjs`) that maps delivery failure/recovery evidence to the universal envelope.
- [ ] **Step 3: Extend existing failure artifact generation to include the event envelope artifact; do not expose secrets.
- [ ] **Step 4: Verify existing delivery-learning tests and Unified Brain Delivery remain GREEN.

### Task 9: Retention expiry guardian without deleting durable knowledge

**Systems:**
- Create one cost-safe scheduled Make scenario only if no existing retention/hygiene guardian can own this responsibility.

**Behavior:**
- Daily bounded query for expired T0/T1/T2 raw evidence.
- Clear/archive raw payload fields only; never delete Tier-3 learning records, fingerprints, payload hashes, evidence refs, graph entities/edges or realized-value attribution.

- [ ] **Step 1: Inventory existing hygiene/retention scenarios to avoid duplication.
- [ ] **Step 2: Write a deterministic expiry decision canary over synthetic/local code data before any Datahub mutation.
- [ ] **Step 3: Implement bounded daily expiry with maximum rows per run and no AI.
- [ ] **Step 4: Prove a T0/T1 raw field can expire while its durable fingerprint/lineage remains queryable through BG209/BG166.

### Task 10: End-to-end closed-loop proof and Brain persistence

**Proof case:** one unique safe known-error canary with no paid external API requirement.

- [ ] **Step 1: Ingest unique event through BG211.
- [ ] **Step 2: Verify Datahub evidence + BG205 node/edge lineage.
- [ ] **Step 3: Verify material learning reaches BG168→BG166 and refreshes BG167.
- [ ] **Step 4: For a repairable canary, verify BG156 executes bounded recovery and returns exact readback.
- [ ] **Step 5: Verify outcome/value relation is persisted when applicable; otherwise explicitly record `not monetized` rather than invented value.
- [ ] **Step 6: Replay the original event and prove no duplicate action/learning.
- [ ] **Step 7: Persist the architecture learning itself under namespace `powerhouse.universal.closed_loop.v1` with fingerprint `powerhouse-universal-event-retention-closed-loop-v1`.
- [ ] **Step 8: Query BG166/BG209 exact readback and record execution IDs/evidence.
- [ ] **Step 9: Run all relevant GitHub checks, compare current main for overlap, merge only exact tested head via governed production path.
- [ ] **Step 10: Verify current main and production/readback before declaring complete.

## Self-review

- Spec coverage: all twelve acceptance criteria are mapped to Tasks 1–10.
- No new Brain/graph/scorer/publisher truth is introduced.
- Tier-3 persistence is explicitly isolated from raw-retention expiry.
- Existing delivery-learning fingerprints remain stable.
- Paid AI/DataForSEO calls are excluded from canaries unless real due work exists.
- Estate-wide migration is adapter-first and incrementally enforceable through BG185; no big-bang producer rewrite.
