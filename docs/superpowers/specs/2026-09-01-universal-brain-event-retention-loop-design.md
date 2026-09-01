# Universal Brain Event & Retention Loop — Design

## Purpose
Make the existing Bedrijfsgeheugen/Powerhouse architecture one estate-wide closed loop without creating a second Brain. Every relevant event from Make, GitHub, Netlify, Notion, website/RUM, SEO, social, CRM, product, agents and external intelligence must enter one normalized evidence contract, preserve causal lineage, drive safe autonomous action, and feed durable learning back into the existing canonical Brain.

## Existing canonical components to preserve
- BG156 — Powerhouse Agent Closed Loop Orchestrator: governed multi-agent execution and bounded self-heal.
- BG168 → BG166 → BG167: material learning router → durable deduped ledger → shared bounded team context.
- BG185 — Agent Fabric Contract Guardian: autonomy/governance drift detection.
- BG205/BG209 — Universal Business Graph persist/read services on the canonical Datahub.
- BG207 — Enterprise Cross-Domain Intelligence Fusion.
- BG206/BG208 — Expected/Realized Value services.
- BG184/BG210 — social/blog obligation guardians.
- BG202 — Opportunity→SEO→Content/Product one-loop.
- GitHub Brain delivery, production promotion, RUM and adapter-conformance contracts.

No new competing memory, opportunity scorer, graph truth or publication state machine may be introduced.

## Universal event envelope
Every producer emits or is adapted into one immutable envelope:

- `event_id`
- `occurred_at`
- `ingested_at`
- `source_system`
- `producer_id`
- `domain`
- `event_type`
- `severity`
- `entity_keys`
- `correlation_id`
- `attribution_root_key`
- `fingerprint`
- `evidence_refs`
- `payload_hash`
- `payload_class`
- `privacy_class`
- `retention_tier`
- `cost_units`
- `status`

The immutable identity is `event_id`; dedupe uses event identity plus a normalized semantic fingerprint. A retry never creates a second durable incident/outcome for the same canonical event.

## Tiered retention
Tiered retention is mandatory.

### Tier 0 — transient telemetry
Heartbeat/debug/low-value raw technical events. Keep only long enough for operational diagnosis. Default target: 7 days.

### Tier 1 — operational evidence
Warnings, retries, data-quality findings, performance anomalies and non-material recoveries. Default target: 30 days.

### Tier 2 — incident/outcome evidence
Material failures, recoveries, releases, publication proofs, customer/commercial outcomes and production incidents. Default target: 180 days for raw payload/evidence where legally and operationally appropriate.

### Tier 3 — permanent intelligence
Fingerprint, symptom, root cause, failed approach, proven fix, prevention rule, regression contract, causal lineage, outcome/value summary, evidence hash/reference, owner and final status. Permanent.

Deleting/expiring a raw payload must never delete Tier-3 learning, graph lineage, immutable evidence reference/hash or realized-value attribution.

Privacy/security policy overrides retention length. Secret-bearing payloads must be redacted or omitted from raw retention and never persisted as durable learning content.

## Universal data flow
`producer/event → normalize → privacy/redaction → fingerprint/dedupe → retention classification → raw/operational evidence persist → graph lineage → materiality decision → autonomous action/recovery → production/outcome readback → value reconciliation → BG168/BG166 durable learning → BG167 shared context → prevention/regression → future decision`

## Canonical storage responsibilities
- Datahub stores event/evidence rows and graph-compatible object/edge/value projections.
- BG205 writes canonical graph entities/edges using immutable keys.
- BG166 stores durable learnings only, not raw telemetry dumps.
- BG167 serves bounded shared context, not full history.
- GitHub stores machine-enforced contracts/tests and durable code/config truth.
- Notion remains human-readable registry/projection/audit where already canonical for that dataset.

## Materiality and learning
Not every event becomes a Brain learning. Deterministic pre-gates classify events:
- non-material heartbeat/debug → evidence only;
- repeated warning/anomaly → evidence + bounded incident state;
- material error/recovery/outcome/contract change → graph + BG168/BG166;
- proven recurring pattern → prevention/regression contract;
- business outcome → impact/value reconciliation and attribution.

AI is downstream of deterministic gating and never required to store/dedupe an event.

## Autonomous repair contract
Every repairable incident follows:
`detect → known-error preflight → root-cause evidence → dedupe/idempotency → safe repair → test/readback → bounded retry/self-heal → production/outcome proof → graph update → learning writeback → prevention/regression`.

A repairable incident may not terminate at diagnosis/advice. Only security/privacy/legal/financially binding/irreversible or explicit authority boundaries may produce `HUMAN_REQUIRED`.

## Estate-wide enforcement
BG185 is extended from PH-runner-centric checks to capability/producer contract coverage. Every active producer/capability must prove or declare:
- event producer/adaptor ownership;
- immutable identity and dedupe strategy;
- retention/privacy classification;
- autonomous trigger/caller where applicable;
- safe execution boundary;
- test/readback;
- bounded recovery;
- outcome evidence;
- Brain writeback/deferred obligation;
- cost guard.

Missing elements yield `AUTONOMY_GAP` with a dedupeable obligation. Safe deterministic fixes may be auto-applied; otherwise route to BG156/governed delivery.

## Cross-system lineage
BG205 receives entities and edges for material events and outcomes. Required relationships include:
- Event `OBSERVED_ON` Source/System
- Event `AFFECTS` Entity/Capability
- Evidence `SUPPORTS` Incident/Learning
- Error `CAUSED_BY` RootCause
- Fix `RESOLVES` Error
- Regression `PREVENTS` Error
- Action `LEADS_TO` Outcome
- Outcome `REALIZES_VALUE_FOR` Opportunity/Entity
- Learning `DERIVED_FROM` Event/Outcome

This allows agents to retrieve not only a known error, but the causal chain and proven prevention.

## Producer adaptation strategy
Do not rewrite every producer at once. Add a canonical event-ingest adapter/service and progressively require producers to emit the envelope. Existing canonical scenarios keep their business function; adapters translate current outputs into the envelope until native emission is added.

Priority integration order:
1. Make runtime/errors/recoveries and autonomous agents.
2. GitHub CI/release/publication failures and recoveries.
3. Netlify deploy/RUM/runtime events.
4. SEO/social/content/publication outcomes.
5. CRM/sales/revenue/product/external intelligence.

## Cost controls
- deterministic classification before AI;
- one ingest event can fan out to graph/learning only after dedupe;
- bounded raw retention;
- change/event-driven ingestion where available;
- no high-frequency estate-wide polling;
- coalesce repeated incidents by fingerprint/window;
- raw telemetry never triggers AI by itself;
- no automatic paid plan/credit upgrade.

## Failure semantics
No false green. Each event/obligation ends in one of:
- `OBSERVED`
- `COALESCED`
- `REPAIR_IN_PROGRESS`
- `RECOVERED_PROVEN`
- `OUTCOME_PROVEN`
- `HUMAN_REQUIRED`
- `DEFERRED_CAPACITY`

Scenario success/config save/merge is not equivalent to outcome proof.

## Migration and compatibility
Existing BG168/BG166 fingerprints and records remain valid. The new envelope adds lineage and retention metadata; it does not invalidate old learnings. Legacy evidence can be backfilled gradually when valuable, not wholesale.

Existing publication, SEO, value and graph services remain canonical and must be called rather than reimplemented.

## Acceptance criteria
The architecture is complete only when:
1. A generic event envelope is machine-validated.
2. Canonical ingest persists evidence idempotently.
3. Retention tier and privacy class are assigned deterministically.
4. Material events create graph lineage and durable learning through existing BG205 and BG168/BG166.
5. A repeated identical event coalesces without duplicate learning/action.
6. A known safe failure can route into BG156/self-heal and finish with readback evidence.
7. BG185 detects producers/capabilities missing the contract.
8. GitHub CI enforces the event/learning contract for repository-side producers.
9. Existing BG184/BG210/BG202/BG206/BG207/BG208 paths remain non-duplicated and functional.
10. Tier-0/1 raw expiry cannot remove Tier-3 learning/lineage.
11. Cost gates prevent AI/retry storms on telemetry noise.
12. Exact execution/readback evidence is recorded before claiming PROVEN.

## Initial fingerprints
- `universal-event-envelope-missing-v1`
- `producer-retention-class-missing-v1`
- `event-learning-lineage-gap-v1`
- `agent-estate-autonomy-contract-gap-v1`
- `raw-retention-deletes-durable-learning-v1`
- `duplicate-event-causes-repeat-action-v1`

## Non-goals
- No raw internet/data dump into Brain.
- No second opportunity scorer.
- No second Business Graph.
- No replacement of BG168/BG166/BG167.
- No unlimited log retention.
- No AI analysis for every telemetry record.
