# Portal V2 post-release gap learning v1

Date: 2026-09-17
Fingerprint: `portal-v2-post-release-gap-learning-v1`
Scope: Bedrijfsgeheugen Powerhouse / Portal V2 / closed-loop operating system
Status: CANONICAL LEARNING + OPEN OBLIGATION SET

## Proven baseline

Portal V2 closed-loop Business Operating System was released through PR #1847. Release lineage:

- feature head: `8ba11ad64cc3cacac88abf84d5f338132452045a`
- protected merge SHA: `35d4c9c5113877d204e3fb4945ce6c4bb6752cb6`
- Netlify production deploy: `6aaae9e116443d00080485bb`
- production `commit_ref`: exact merge SHA above
- Required, BRAIN delivery, CodeQL, Portal V2 tests, browser/mobile checks, immutable preview, production DOM/readback and visual regression: green
- production visual regression artifact: `production-ui-visual-regression`

Release #1847 added the Executive Cockpit, versioned Impact Engine, immutable Scenario Simulator, governed Next Best Actions, monitoring/learning, evidence health, capability graph and canonical `os:*` routing without creating a parallel database, CRM, AI brain, workflow engine, queue, calendar or learning store.

## Learning: a green release is not equivalent to a fully closed Powerhouse

The release is LIVE & BEWEZEN for the delivered scope. It does not prove that every historical Portal/Powerhouse obligation is complete. Future agents must distinguish:

1. `release scope proven live`;
2. `whole capability parity proven`;
3. `runtime closed loop proven on real outcomes`;
4. `historic obligation register reconciled with current truth`;
5. `learning/control-plane debt retired or migrated`.

Never infer 2–5 only from 1.

## Remaining canonical gaps

### A. Full legacy parity closure

Requirement: every legacy Portal capability must have one machine-verifiable disposition:

- `NATIVE_VERIFIED` — implemented in Portal V2 with functional + browser/readback evidence;
- `SUPERSEDED_VERIFIED` — intentionally replaced by a named newer capability with equivalent/stronger outcome;
- `RETIRED_APPROVED` — explicitly retired with rationale and no required user journey left behind.

No capability may disappear by omission. Build/maintain a canonical parity matrix containing old capability id, new authority, required read/write/interactions, evidence, disposition and last verification SHA. Specific analytical/model surfaces such as BCG must be covered if they existed in the prior portal experience or requirement lineage.

Prevention rule: `PORTAL_PARITY_REQUIRES_EXPLICIT_DISPOSITION_AND_EVIDENCE`.

### B. Canonical backend closed loop

Portal UI is a projection/interaction layer. For material recommendations/actions, the canonical backend loop must be persistent and tenant-scoped:

`SIGNAL -> UNDERSTAND -> PREDICT -> DECIDE -> ACT -> PROVIDER/EXECUTION READBACK -> OUTCOME -> REALIZED VALUE -> CALIBRATE -> NEXT DECISION`.

Browser-only state, inferred outcomes or UI confirmation are insufficient. Existing Powerhouse authorities, queues, outcome records, relationship graph, runtime events and learning/calibration stores must be reused.

Prevention rule: `NO_PORTAL_ONLY_CLOSED_LOOP`.

### C. Real business outcome density

Estimated and forecast value must remain separate from realized value. The Powerhouse should increase observed outcome density for revenue, cost reduction, time saved, conversion, risk reduction and other tenant-defined KPIs. Ranking/calibration should learn from explicit outcome evidence, not from recommendation acceptance alone.

Prevention rules:

- `REALIZED_VALUE_REQUIRES_OBSERVED_OUTCOME_EVIDENCE`;
- `ACCEPTED_RECOMMENDATION_IS_NOT_REALIZED_VALUE`;
- `CALIBRATION_USES_EXPECTED_VS_OBSERVED`.

### D. Obligation reconciliation against current truth

Open historical issues/obligations can become stale after later releases. A stale obligation must not remain operational truth merely because it is open.

Required reconciliation loop:

1. read current canonical runtime/platform evidence;
2. compare it to issue assumptions/evidence;
3. classify obligation as `STILL_VALID`, `RESOLVED_BY_LATER_RELEASE`, `SUPERSEDED`, or `REQUIRES_MIGRATION`;
4. close/update the original record with exact evidence and successor lineage;
5. never delete historical evidence.

Known examples requiring reconciliation include historical Netlify deployment/main-protection incidents whose assumptions may no longer match current protected-main and exact-SHA production evidence.

Prevention rule: `OPEN_ISSUE_IS_NOT_CURRENT_TRUTH_WITHOUT_REVALIDATION`.

### E. Retire/migrate legacy Make learning obligations

Current architecture authority is Supabase/Powerhouse and GitHub-native governed delivery; Make is retired and must not return as a dependency. Historical BG168/BG166/Make replay obligations must therefore be reconciled, not blindly replayed.

For each historical Make-based learning obligation:

- preserve fingerprint, source evidence, root cause and prevention rule;
- map it to the current canonical Powerhouse learning/writeback authority;
- persist/read back via the current route if the learning is still material;
- mark the legacy Make execution path `SUPERSEDED` after successful canonical migration;
- do not reactivate Make merely to satisfy an obsolete transport contract.

Prevention rule: `LEGACY_TRANSPORT_OBLIGATION_MUST_MIGRATE_TO_CURRENT_AUTHORITY`.

### F. Autonomous Quality Intelligence closure

Quality Intelligence should continuously convert escaped defects and production anomalies into reusable regression coverage and prevention. Required direction:

- production invariants and exact-SHA readback;
- dynamic risk-based test selection without weakening mandatory gates;
- visual/layout/a11y/responsive regressions;
- backend/security/data-integrity/property/contract tests;
- performance and cost regressions;
- bounded fault injection/game-day coverage where safe;
- automatic incident -> root cause -> regression test -> prevention -> learning lineage.

Prevention rule: `ESCAPED_DEFECT_MUST_CREATE_REUSABLE_PREVENTION_WHERE_TECHNICALLY_POSSIBLE`.

### G. Security and data-governance obligations remain independent

A green Portal release must never implicitly close independent Supabase/Auth/RLS/tenant-isolation/data-governance obligations. Those require their own live evidence and current advisor/runtime verification.

Prevention rule: `RELEASE_GREEN_DOES_NOT_TRANSITIVELY_CLOSE_SECURITY_OBLIGATIONS`.

## Canonical priority order

1. Full Legacy Parity Closure
2. Canonical backend closed-loop persistence/execution/readback
3. Increase real outcome/value evidence density
4. Reconcile stale obligations against current truth
5. Migrate/supersede legacy Make learning obligations
6. Close independent security/data-governance findings
7. Extend autonomous Quality Intelligence from every escaped defect/outcome

## Agent operating contract

All relevant agents/chats must:

- EXISTING-STATE-FIRST: read current Portal V2, Powerhouse authorities, open obligations and recent release evidence before proposing work;
- REUSE-FIRST: extend existing canonical components, never create parallel state/brain/queue/learning stores;
- CANONICAL-INTEGRATION: every new portal capability must identify its source authority, write authority, evidence lineage and outcome owner;
- CLOSED-LOOP: do not stop at UI/code/merge; verify production behavior and write learning/prevention back;
- CURRENT-TRUTH-FIRST: revalidate historical issues before treating them as active blockers;
- fail closed on identity, tenant, permissions, destination, realized-value attribution and material external execution.

## Definition of done for the gap set

This learning set is fully closed only when evidence proves:

- every legacy Portal capability has an explicit verified disposition;
- material Portal actions traverse the persistent canonical backend loop;
- realized value is based on observed outcomes and feeds calibration;
- stale historical obligations are reconciled/closed/superseded with evidence;
- legacy Make-based learning obligations are migrated or explicitly superseded without restoring Make dependency;
- independent security/data-governance obligations are resolved with live verification;
- new escaped defects automatically enrich tests/guards/learning lineage.

Until then, each item remains an active improvement obligation, not a reason to downgrade the proven LIVE status of release #1847.