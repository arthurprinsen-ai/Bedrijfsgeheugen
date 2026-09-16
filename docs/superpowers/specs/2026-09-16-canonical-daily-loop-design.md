# Canonical Powerhouse Daily Closed Loop — Design

Date: 2026-09-16
Status: DESIGN APPROVED IN CHAT; IMPLEMENTATION NOT YET STARTED
Owner system: Bedrijfsgeheugen Powerhouse

## Purpose

Create one canonical daily closed loop across Powerhouse, cockpit, Notion Dagplan, Content Calendar, execution providers, outcomes, metrics and learning without introducing a parallel database, queue, CRM, calendar, brain or learning system.

The loop must make daily state explainable and provable. A task may be projected to multiple human-facing surfaces, but there is only one canonical action identity and one canonical outcome lineage.

## Non-negotiable principles

1. Supabase/Powerhouse remains runtime authority.
2. Cockpit, Notion Dagplan and Content Calendar are projections/views, not independent sources of truth.
3. Reuse existing Powerhouse action, outcome-obligation, learning, content, relationship, publication and runtime components.
4. No Make dependency is introduced or restored.
5. Every material action carries one stable lineage from decision through execution, outcome and learning.
6. Every external side effect is idempotent and evidence-backed.
7. A green technical run is not sufficient; outcome/readback evidence is required where an outcome obligation exists.
8. Every daily loop run is Europe/Amsterdam-date aware.
9. No silent zero-state: an unexpected empty projection is treated as a failed invariant, not as success.
10. BG169 remains production-promotion authority for GitHub-backed releases.

## Canonical flow

```text
Powerhouse signals/state
        ↓
Daily decision + prioritisation
        ↓
Canonical daily run
        ↓
Canonical action set
   ┌────┼───────────────┐
   ↓    ↓               ↓
Cockpit Notion Dagplan  Content Calendar
   └────┼───────────────┘
        ↓
Execution/provider action
        ↓
Provider/runtime readback
        ↓
Outcome + metrics + evidence
        ↓
Learning/calibration/writeback
        ↓
Updated Powerhouse state
        ↓
Next decision cycle
```

## Authority model

### Runtime authority

Supabase/Powerhouse owns:
- canonical action identity;
- daily run identity;
- action lifecycle state;
- channel/execution eligibility;
- outcome obligation;
- execution evidence;
- observed metrics/outcomes;
- learning/calibration lineage;
- recovery obligation and parity state.

### Projection surfaces

Cockpit, Notion Dagplan and Content Calendar may display or enrich canonical state but may not mint competing runtime identities.

Notion is used for human-readable planning, review, audit and projection. A Notion page ID can be retained as a projection reference, but it is never the primary canonical action key.

## Canonical identities

Each daily cycle has:

- `daily_run_id`: immutable ID for one Europe/Amsterdam business date and run lineage;
- `action_id`: immutable canonical Powerhouse action ID;
- `projection_key`: deterministic key derived from canonical identity and projection type;
- `outcome_obligation_id`: immutable obligation linked to the action where an outcome is due;
- `evidence_id`: execution/readback evidence identity;
- `learning_id`: resulting learning/calibration reference when material.

Required invariant:

```text
one action_id -> zero or more projections -> zero or more executions -> one reconciled lifecycle -> outcomes/evidence -> learning
```

A projection must never create a second action identity for the same business action.

## Projection model

### Cockpit

Shows actionable canonical actions with current priority, state, reason, owner, eligibility, evidence and recovery status.

### Notion Dagplan

Contains only human-actionable daily work that meets the existing Dagplan contract. It is populated by deterministic upsert using the canonical action identity and date. Existing fields such as `Bron`, `Bron-ID`, `Duplicaatsleutel`, `Datum`, channel and outcome context are reused where compatible.

### Content Calendar

Contains content actions that require planning/publication lifecycle. The Content Calendar remains the human planning/projection layer; publication truth comes from provider/runtime evidence and is reconciled back to the canonical action.

### Overlap

An action may appear in cockpit plus Dagplan, or cockpit plus Content Calendar, or all three when business semantics require it. Therefore raw row counts do not have to be identical across all surfaces.

Parity is based on expected projection membership per canonical action, not on naive equality of all table sizes.

## Daily orchestration

The existing Powerhouse runtime must produce or reconcile one logical `daily_run` for the current Europe/Amsterdam business date.

The orchestrator does not become a new brain. It is a coordinator over existing canonical capabilities:

1. read current Powerhouse signals, obligations and eligible actions;
2. dedupe and prioritise using existing business logic;
3. assign/reuse stable `action_id` values;
4. determine expected projection membership;
5. upsert projections idempotently;
6. verify projection readback;
7. dispatch eligible execution through existing supported routes;
8. collect provider/runtime evidence;
9. reconcile outcomes and metrics;
10. write material learning/calibration;
11. verify all due obligations;
12. publish daily parity/readback state.

## Projection parity contract

For every canonical action `A` in a daily run, compute expected projection membership:

```text
expected(A) = {cockpit?, dagplan?, content_calendar?}
```

For each expected projection, exactly one active projection must exist for the relevant daily state unless the existing domain model explicitly permits versioning.

Required checks:

- no missing expected projection;
- no duplicate active projection;
- no orphan projection without canonical action;
- no stale date caused by UTC/Europe-Amsterdam mismatch;
- no completed/cancelled action incorrectly shown as active;
- no publication marked successful without provider evidence;
- no completed obligation without valid evidence policy;
- no action silently disappearing between runs.

## Zero-state protection

A daily run that results in zero Dagplan rows is not automatically an error because not every day necessarily contains human tasks. It becomes an error when canonical actions exist whose expected projection contains `dagplan` and the projection count/readback is zero or incomplete.

The same rule applies to cockpit and Content Calendar.

This prevents false alarms while eliminating the current failure mode where a broken writer can present an apparently valid empty day.

## Reconciliation and self-healing

Parity/readback creates a recovery obligation when any invariant fails.

Recovery procedure:

1. detect mismatch;
2. identify missing/duplicate/orphan/stale projection by canonical identity;
3. inspect existing external/projected evidence before writing;
4. repair with idempotent upsert/update where safe;
5. re-read projection;
6. reconcile canonical lifecycle;
7. emit `AUTO_REPAIR` or `RECOVERY` material outcome;
8. write root cause and prevention learning;
9. refresh shared team context.

No retry may create duplicate publication, message, task or outcome.

## Legacy handling

Historical Make-based syncs such as BG121/BG138/BG146 may remain as audit history, but must not be reactivated as runtime authority.

During implementation:
- locate current supported successors in GitHub/Supabase;
- reuse existing writers/readers where current and valid;
- mark old Make-era runtime contracts as retired/superseded in human documentation when evidence confirms replacement;
- preserve historical evidence and lineage.

## Data contract changes

Implementation should prefer extending existing tables/functions over creating new persistent entities.

A new persistent table is only allowed if code/runtime inspection proves no existing canonical entity can represent `daily_run` or projection reconciliation without overloading unrelated semantics. If one is required, it must be registered in the Canonical System Map and existing data governance, RLS, retention, observability and outcome-writeback rules apply.

## Time semantics

All daily selection and projection membership is defined on `Europe/Amsterdam` business date.

Tests must cover:
- normal CET day;
- normal CEST day;
- DST spring-forward boundary;
- DST autumn fallback boundary;
- UTC timestamp crossing local midnight.

## Failure semantics

The daily loop is not green solely because writers returned HTTP 2xx or database statements succeeded.

Possible operational states:
- `GREEN`: expected projections/readbacks and due outcome obligations reconcile;
- `REPAIRING`: safe self-healing is in progress;
- `BLOCKED_HARD_BOUNDARY`: only for credential/permission/security/destructive/paid/legal-financial boundary;
- `MISSED_OBLIGATION`: due expected result lacks valid evidence.

A projection mismatch cannot terminate as an unexplained empty result.

## Observability

The loop must expose at minimum per daily run:
- run ID and local business date;
- canonical action count;
- expected projection counts by surface;
- actual projection counts by surface;
- missing/duplicate/orphan counts;
- execution count;
- evidence/readback count;
- due/completed/missed outcome obligations;
- auto-repair count;
- unresolved blockers;
- last successful reconciliation timestamp;
- exact code/runtime version where available.

Cockpit should expose a concise health/readback representation rather than forcing manual SQL/Notion comparison.

## Security and permissions

- no service-role secret is exposed to browser clients;
- Notion writes remain server-side through the supported integration path;
- RLS/service-role boundaries remain unchanged unless a separately reviewed security change is required;
- credentials are never stored in Notion or source control;
- failure to obtain required credentials is `BLOCKED_HARD_BOUNDARY`, not a reason to bypass the normal route.

## Testing strategy

Implementation must include tests at the smallest useful layer and an end-to-end reconciliation test.

Minimum regression coverage:

1. stable identity/idempotent rerun;
2. cockpit projection creation/update;
3. Dagplan projection creation/update;
4. Content Calendar projection creation/update;
5. expected-projection parity calculation;
6. duplicate prevention;
7. orphan detection;
8. completion/cancellation propagation;
9. Europe/Amsterdam date boundaries;
10. provider evidence reconciliation;
11. missed outcome obligation detection;
12. recovery does not duplicate external side effects;
13. learning/writeback after material recovery;
14. zero-state protection;
15. legacy Make path not required for success.

## Production acceptance criteria

The change is not `LIVE & BEWEZEN` until all applicable items below are evidenced in production:

1. current Powerhouse state produces a daily canonical action set;
2. each action has stable canonical identity;
3. expected cockpit/Dagplan/Content Calendar projections exist exactly as required;
4. rerunning reconciliation is idempotent;
5. no active orphan/duplicate projection remains for the tested daily run;
6. Europe/Amsterdam date is correct;
7. execution/provider readback is attached to the same action lineage;
8. due outcome obligations are reconciled with valid evidence or explicit hard blocker;
9. material recovery/outcome is written into the existing learning/shared-context path;
10. production health/readback exposes parity state;
11. existing release, security, BRAIN, CodeQL and required gates remain green;
12. promotion follows BG169 and exact promoted SHA is read back in production.

## Non-goals

This design does not:
- replace the CRM;
- replace the Content Calendar;
- replace Notion;
- create a new generic workflow engine;
- reactivate Make;
- redesign the cockpit UI beyond the minimal health/readback representation needed for this contract;
- alter business prioritisation algorithms except where a discovered defect directly prevents canonical reconciliation.

## Rollback

Implementation must be additive/compatibility-first. Existing projections remain readable while the canonical reconciliation path is introduced.

If production verification fails:
- stop new projection writes from the changed path;
- preserve existing external evidence;
- revert/promote last-known-good through BG169;
- do not delete human-created Notion content or external publications;
- record failure and recovery through the normal material outcome path.

## Documentation obligations

When implementation changes runtime behavior, update at minimum:
- Powerhouse Canonical System Map;
- Powerhouse Menselijk Handboek;
- cockpit architecture/operations runbook;
- relevant error/release ledger;
- retirement/supersession status for confirmed legacy Make paths;
- schema/data dictionary if fields or persistent entities change.

## Implementation decision

Preferred implementation is to extend existing Powerhouse runtime/action/outcome/learning components and attach deterministic projection reconciliation for cockpit, Dagplan and Content Calendar.

Creating a second daily-planning database or a separate integration brain is explicitly rejected.
