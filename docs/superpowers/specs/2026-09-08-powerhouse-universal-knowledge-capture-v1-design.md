# Powerhouse Universal Knowledge Capture v1 — Design

Date: 2026-09-08
Status: Design approved in chat; awaiting written-spec review before implementation planning
Owner: Powerhouse / Bedrijfsgeheugen
Canonical learning plane: BG168 → BG166 → BG167

## 1. Purpose

Powerhouse already has a material-learning router (BG168), a deduplicating error/learning ledger writer (BG166), a shared context/readback hub (BG167), a Direct Knowledge Base, an Architecture & Operations Runbook, an Error Register, release gates, and closed-loop operating rules.

The remaining gap is not a new Brain. The gap is universal capture and normalization: every material chat, agent action, release, deployment, operational incident, architecture change, Notion change, portal/CRM outcome, and human intervention must be represented by one consistent machine-readable knowledge envelope, routed through the existing learning plane, and projected back into the knowledge surfaces used by humans and agents.

This design therefore adds a Universal Knowledge Capture layer above the existing BG168/BG166/BG167 control plane. It does not introduce a parallel memory system.

## 2. Design principles

1. **One control plane.** BG168/BG166/BG167 remain canonical for material learning routing, durable learning/error write, and readback/context projection.
2. **Normalized, not raw.** Powerhouse does not store full chat transcripts or full agent logs by default. It stores normalized records with strong source references. Raw source content remains in its originating system unless an audit/incident policy explicitly requires retention.
3. **Evidence before closure.** A knowledge event may not be `closed` without downstream evidence and canonical readback.
4. **No silent loss.** If Brain writeback is unavailable, the event remains one deduplicated open obligation for exactly-once replay.
5. **Materiality first.** Not every action becomes a learning. BG168 remains responsible for materiality classification.
6. **Architecture is first-class knowledge.** Every material technical change must identify impacted components, layers, dependencies, blast radius, rollback, and documentation surfaces.
7. **Source traceability.** Every normalized event must be reconstructable from source references: chat/session reference, PR, commit, deploy, Make execution, Notion page, portal record, CRM/outcome record, or equivalent.
8. **Closed-loop by construction.** Capture follows: signal → context/classify → decide → execute → verify/readback → outcome → learn → guard/prevent → next decision.
9. **No duplicate truth.** Notion, cockpit, repository documentation, Error Register, and release audit are projections of canonical event state; they must not diverge into competing authorities.
10. **Cost-aware.** Capture, classification, projection, and replay must deduplicate aggressively and avoid unnecessary LLM/Make executions.

## 3. Scope

### In scope

- ChatGPT chats relevant to Bedrijfsgeheugen/Powerhouse
- Powerhouse/Make agent actions
- GitHub PRs, commits, merges, checks, release control-plane events
- Netlify preview and production deployments
- Make scenario executions and recovery events
- Notion architecture/knowledge changes
- Portal/customer workflow state changes where they create a material operational outcome
- CRM/commercial outcomes when they change future scoring/routing
- Human interventions that materially change system configuration or unblock production
- Architecture changes, incidents, fixes, regressions, prevention rules and rollbacks
- Canonical source-reference model
- Failure spool and exactly-once replay
- Architecture impact resolution
- Timeline/query projection
- Release gate requirements for material changes

### Out of scope for v1

- Storing complete raw chat transcripts as canonical Brain content
- Replacing existing BG168/BG166/BG167 scenarios
- Creating a second learning ledger
- Replacing Notion as a human-facing knowledge projection
- Replacing GitHub/Netlify/Make source-of-truth data for their native execution history
- Unlimited historical backfill of every past chat/action; only selected high-value canaries and future events are required initially

## 4. Existing components retained

### BG168 — Multi-Agent Outcome & Learning Router

Responsibilities retained:
- receives agent/task/result input
- classifies material team learning
- claims idempotency/fingerprint window
- routes only material outcomes to BG166
- returns non-material/deferred outcomes without failing the caller

Required extension:
- accept a versioned normalized envelope or a backward-compatible wrapper around the existing interface
- preserve current materiality semantics
- expose routing outcome and canonical event/fingerprint identity in a stable response contract

### BG166 — Error & Learning Ledger Writer

Responsibilities retained:
- normalize learning/error record
- dedupe by fingerprint
- persist canonical learning record
- trigger BG167 refresh
- coalesce duplicate writes

Required extension:
- persist the Universal Knowledge Envelope fields needed for cross-source traceability, architecture impact, outcome state, source references, replay state and next decision
- preserve duplicate-coalescing semantics

### BG167 — Shared Multi-Agent Team Context Hub

Responsibilities retained:
- read latest shared learning
- build bounded team briefing
- suppress non-material artifacts
- enforce current Brain/CI-CD context rules
- publish context cache

Required extension:
- support canonical readback by `event_id` and/or `fingerprint`
- expose enough structured proof to mark a knowledge event closed
- project architecture impact and next-decision information into bounded agent context

## 5. Universal Knowledge Envelope v1

Every material event is represented by a versioned envelope.

Minimum schema:

```json
{
  "schema_version": "powerhouse.knowledge-event.v1",
  "event_id": "uuid-or-deterministic-id",
  "dedupe_key": "stable-dedupe-key",
  "fingerprint": "semantic-error-or-learning-fingerprint",
  "occurred_at": "ISO-8601",
  "captured_at": "ISO-8601",
  "source_type": "chat|agent|github|netlify|make|notion|portal|crm|human|other",
  "source_refs": [],
  "actor": {
    "type": "human|chat|agent|workflow|service",
    "id": "stable-id",
    "name": "display-name"
  },
  "component": "canonical-component-id",
  "architecture_layer": "frontend|adapter|runtime|ingest|intelligence|control-plane|core|ops|knowledge",
  "intent": "what was being achieved",
  "context_summary": "bounded normalized context",
  "decision": {
    "decision": "what was decided",
    "rationale": "why",
    "owner": "human-or-agent-owner"
  },
  "action": {
    "summary": "what changed or ran",
    "technical_changes": []
  },
  "evidence": [],
  "outcome": {
    "status": "success|failed|partial|blocked|open",
    "summary": "observed downstream result"
  },
  "root_cause": null,
  "learning": null,
  "guard_prevention": [],
  "regression": [],
  "architecture_impact": {
    "components": [],
    "dependencies": [],
    "blast_radius": [],
    "documentation_surfaces": []
  },
  "rollback": {
    "strategy": "",
    "last_known_good_ref": null
  },
  "cost_signal": null,
  "health_signal": null,
  "next_decision": null,
  "writeback": {
    "state": "pending|written|deferred|blocked|failed",
    "bg168_ref": null,
    "bg166_ref": null
  },
  "readback": {
    "state": "pending|verified|failed",
    "bg167_ref": null,
    "verified_at": null
  }
}
```

### Source reference contract

Each `source_refs[]` item must include:

- `system`
- `kind`
- `id`
- optional `url`
- optional `sha`
- optional `version`
- optional `execution_id`
- optional `deploy_id`
- optional `relationship` such as `origin`, `evidence`, `result`, `rollback`, `documentation`

Examples:
- GitHub PR #1159
- feature head SHA
- merge SHA
- Netlify deploy ID
- Make scenario/execution ID
- Notion page ID
- chat/session reference

## 6. Capture adapters

Each source gets a thin adapter that emits the same envelope rather than source-specific knowledge formats.

### Chat adapter

Captures only material Powerhouse/Bedrijfsgeheugen outcomes.

Required normalized fields:
- intent
- decision + rationale
- action
- evidence
- outcome
- learning
- guard/prevention
- next decision
- source/session reference

No complete transcript is written by default.

### Agent adapter

All Powerhouse agents must finish material tasks through the same completion contract. A successful agent action without outcome/readback is still open.

The adapter must be reusable by Make agents, ChatGPT-driven work, repository agents, and future agents.

### GitHub adapter

Captures:
- PR/open/update/merge
- relevant commit SHA
- required checks and release control-plane failures
- merge outcome
- selected regression/prevention signals

Avoid one knowledge event per noisy check. Prefer one material event with check evidence attached.

### Netlify adapter

Captures:
- preview readiness when material to a release decision
- production deploy ID
- exact commit_ref
- state
- publish/readback timestamps
- deploy error/validation evidence

### Make adapter

Captures:
- material scenario outcome
- execution ID
- status/error
- recovery/replay state
- credit/data-transfer signal when relevant

### Notion adapter

Captures material knowledge/architecture changes as projections, not as canonical independent learning.

### Portal/CRM adapter

Captures material customer/business outcomes that influence scoring, routing, compliance, execution or next actions.

### Human intervention adapter

Captures material manual interventions such as protected-branch settings changes, production unblock actions, manual approvals, or recovery actions.

## 7. Architecture Impact Resolver

A new shared resolver maps each material event to canonical architecture knowledge.

Inputs:
- changed files/routes/scenarios/components
- source system
- event type
- declared component
- registry/knowledge-index metadata

Outputs:
- impacted canonical components
- architecture layer
- dependencies
- blast radius
- documentation surfaces
- expected tests/gates
- rollback owner/path

Rules:
1. Prefer explicit registry mappings over LLM inference.
2. Fail closed when no canonical component can be resolved for a material technical change.
3. If inference is used, mark confidence and require later canonical mapping.
4. A new component must be added to the machine-readable knowledge index before release closure.

## 8. Materiality and dedupe

BG168 remains the only material-learning promotion decision point.

The universal capture layer may classify an event as candidate material, but canonical promotion still belongs to BG168.

Dedupe levels:
1. source-event idempotency — same source event is not captured twice
2. semantic fingerprint dedupe — same failure/learning coalesces
3. time-window coalescing — bursty identical outcomes avoid repeated writes
4. projection idempotency — repeated projection does not create duplicate Notion/cockpit records

## 9. Failure spool and exactly-once replay

Because the learning plane can be operationally unavailable or paused, capture must not depend on immediate Brain execution.

When BG168/BG166/BG167 cannot execute:

1. normalize the event
2. assign `event_id`, `dedupe_key`, and fingerprint
3. persist one open outcome obligation in the spool
4. set writeback state `blocked` or `deferred`
5. do not repeatedly retry in a credit-burning loop
6. when runtime health is restored, replay exactly once
7. after BG166 write, require BG167 readback
8. close the spool item only after readback verifies the canonical fingerprint/event

The spool is not a competing Brain. It is a durable transport/recovery obligation.

## 10. Projection model

Canonical event state projects to:

- Powerhouse Cockpit timeline
- Knowledge Center
- Direct Knowledge Base
- Architecture Registry / knowledge-index
- Error Register
- release audit / go-live register
- bounded BG167 team context

Projection requirements:
- idempotent
- source-linked
- current-state aware
- no raw transcript duplication
- no closure claim when readback is missing

## 11. Query and timeline experience

The system must support reconstructing a material change as a single chain:

`source chat/agent → decision → action/code → PR/commit → checks → merge → deploy → production readback → outcome → learning → guard/regression → next decision`

Minimum query dimensions:
- event_id
- fingerprint
- component
- source type
- PR/commit/deploy/scenario ID
- architecture layer
- outcome status
- time range
- open/blocked obligations

## 12. Release-gate contract

For material technical changes, release closure must fail when any required field is missing:

- canonical component mapping
- source references
- evidence
- outcome
- architecture impact
- rollback
- guard/regression where technically applicable
- knowledge projection
- Brain writeback/readback, or an explicit open blocked obligation if an external platform prevents it

A blocked Brain runtime must not block an otherwise safe production release unless the change specifically requires live Brain behavior, but the learning obligation must remain visibly open and cannot be reported as fully `geborgd`.

## 13. Security, privacy and retention

- Do not store full chat transcripts by default.
- Do not copy secrets, credentials, tokens, personal confidential payloads or raw provider responses into the knowledge envelope.
- Source references should point back to authoritative systems instead of duplicating sensitive source data.
- Normalize only the minimum context required for future decisions, auditability and learning.
- Apply existing access controls of Brain/Notion/cockpit projections.

## 14. Observability

Required metrics:
- candidate events captured
- material events promoted
- duplicate/coalesced events
- writeback success/failure/deferred
- BG167 readback success/failure
- open replay obligations
- mean time from source event to canonical readback
- events without architecture mapping
- projection lag/failure
- capture/replay credit and data-transfer consumption

Required health states:
- `healthy`
- `degraded`
- `blocked`
- `replaying`

## 15. Homepage video repair — first end-to-end canary

The homepage hero-video repair is the first required canary for Universal Knowledge Capture v1.

### Source chain

- Chat: homepage video repair conversation
- GitHub PR: `#1159 Fix homepage hero video autoplay recovery`
- feature head: `f74cfdfa1225ba1ad8427e5719ec7b4f1f18c84a`
- merge SHA: `7695e386ed7b234391dfa4d8ef0de7479dd48aa5`
- production Netlify deploy: `6a9fe513a7af0e0008661320`
- production `commit_ref`: exact merge SHA above
- code evidence: `assets/js/menu.js`, `initHeroVideoRecovery`

### Outcome

Homepage video runtime recovery was merged and deployed to production with exact SHA/deploy mapping and production source readback.

### Learning A — homepage media resilience

Fingerprint: `homepage-hero-video-autoplay-lifecycle-recovery-v1`

Root cause class:
- static autoplay attributes alone do not guarantee continued playback after browser lifecycle/autoplay interruptions, particularly on iOS/Safari-like behavior.

Guard/prevention:
- runtime `muted`, `defaultMuted`, `playsInline`, `autoplay`, `loop`
- recovery on media readiness, `pageshow`, `visibilitychange`, pause and first safe interaction
- dedicated homepage hero-video contract/regression should verify markup + recovery wiring and, where browser automation permits, playback progress

### Learning B — protected status publication mismatch

Fingerprint: `github-required-test-synthetic-merge-ref-status-gap-v1`

Observed behavior:
- all substantive Required test lanes were green
- the current head had a successful `test` job/status
- GitHub merge endpoint still returned `Required status check "test" is expected`
- synthetic PR merge SHAs could have zero check-runs
- branch protection became usable after retaining required `test` while disabling `Require branches to be up to date before merging`

Guard/prevention:
- protected required check context must map to the actual publishing GitHub Actions app
- release diagnostics must distinguish `failed`, `queued`, `success-but-not-recognized`, and `expected-on-synthetic-ref`
- do not repeatedly rerun entire test suites when the failure is status publication/ref association
- do not disable the required `test` gate to unblock a release
- branch protection configuration belongs in the release-control-plane knowledge model and must be monitored for drift

### Canary success criteria

The homepage-video event is successful only when Powerhouse can answer, from normalized knowledge and source refs:

- what the original problem was
- what was changed
- why the change was chosen
- which PR/head/merge SHA implemented it
- which checks passed
- which GitHub release-control-plane blocker occurred
- which human intervention resolved the blocker
- which Netlify production deploy contains the fix
- what prevention/regression now protects against recurrence
- what remains open, if any

## 16. Implementation boundaries

### Must change or add

- versioned universal knowledge-event schema
- capture/normalization library or shared contract
- source-reference utilities
- architecture impact resolver
- failure spool/replay obligation model
- BG168-compatible envelope adapter
- BG166 field mapping extension
- BG167 event/fingerprint readback extension
- projection adapters
- release-gate validation
- tests for schema, dedupe, materiality handoff, replay, readback and projections
- homepage-video canary fixture/test
- documentation/knowledge-index registration

### Must not change unnecessarily

- existing BG168 materiality logic
- BG166 duplicate-coalescing semantics
- BG167 bounded context principles
- unrelated content, CRM, portal or website behavior
- production release gates except where adding knowledge-capture validation

## 17. Testing strategy

### Unit/contract tests

- envelope schema validation
- source-ref validation
- deterministic dedupe key generation
- secret/redaction rules
- architecture impact resolution
- projection idempotency
- replay state transitions

### Integration tests

- adapter → BG168 compatibility
- BG168 material → BG166 write
- BG166 write → BG167 refresh/readback
- duplicate event coalescing
- blocked runtime → spool → exactly-once replay → readback close

### Regression tests

- existing Shared Agent Memory tests remain green
- existing BG168 materiality promotion tests remain green
- existing Brain foundation tests remain green
- existing release-control-plane tests remain green

### Canary test

Reconstruct the homepage-video repair from its normalized event and verify the expected PR, head, merge SHA, deploy ID, production SHA mapping, fingerprints and prevention rules.

## 18. Rollout

Phase 1 — schema + adapters + canary
- implement universal envelope
- add compatibility adapter to BG168
- implement homepage-video canary
- no broad mandatory enforcement yet

Phase 2 — durable replay + readback
- add spool/replay
- extend BG166/BG167 contracts
- prove exactly-once replay and event readback

Phase 3 — architecture impact + projections
- wire knowledge-index resolver
- cockpit/Notion/Error Register/release audit projections

Phase 4 — mandatory gates
- enforce capture/readback requirements for material changes
- migrate all Powerhouse agents to the shared completion contract

Phase 5 — broader source coverage
- GitHub, Netlify, Make, Notion, portal, CRM and human-intervention adapters
- backfill only selected high-value historical events

## 19. Definition of done

Universal Knowledge Capture v1 is complete when:

1. all supported source types can emit the same envelope
2. material events route through BG168/BG166/BG167
3. duplicates coalesce deterministically
4. blocked writeback produces one replay obligation, not lost data or retry storms
5. BG167 can prove canonical readback for an event/fingerprint
6. architecture impact is machine-readable
7. projections are idempotent and source-linked
8. material releases cannot be falsely reported as fully closed without required evidence/readback
9. the homepage-video repair canary is fully reconstructable end-to-end
10. existing Brain, website and release regressions remain green

## 20. Open implementation questions resolved by this design

- Canonical authority: existing BG168/BG166/BG167 learning plane, not Notion or Git
- Storage model: normalized records + source refs, not full transcript retention
- Materiality owner: BG168
- Durable learning writer: BG166
- Canonical readback/context: BG167
- Failure behavior: durable deduplicated obligation + exactly-once replay
- Architecture mapping: registry-first resolver, fail-closed for unmapped material changes
- Initial canary: homepage video repair / PR #1159

No additional architectural decision is required before implementation planning unless repository inspection reveals a hard incompatibility with these boundaries.
