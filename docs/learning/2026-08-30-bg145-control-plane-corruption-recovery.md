# BG145 Control Plane Corruption Recovery — 2026-08-30

## Incident
BG145 `Powerhouse Control Plane Delta API v2 Datahub-backed` returned 12 syntactically valid but semantically corrupted controls. Examples before recovery:

- `runtime.config.cacheSeconds`: Enabled=false, Value=`Nog onvoldoende bewijs voor menselijke actie.`, ValueType=`LinkedIn persoonlijk`, Version=13.3.
- `runtime.remoteRefreshSeconds`: same corruption.
- governance controls were disabled and carried commercial/opportunity values.

This passed earlier technical contract checks because BG145 still returned the expected seven fields and HTTP 200. The error proves that **schema-shape equality is not semantic equivalence**.

## Canonical truth
The original `Powerhouse Control Plane` data source (`c1240088-1851-4350-9a44-9fb7fe7ec3eb`) remains readable in Notion and contains the intended 12 controls:

- cockpit.calendar.cacheSeconds = 120 number enabled
- cockpit.calendar.defaultView = week text enabled
- cockpit.calendar.enabled = true boolean enabled
- dm.backfill.sliceSize = 8 number enabled
- feed.decision.maxCandidates = 8 number enabled
- governance.architectureContract.required = true boolean enabled
- governance.changeEvidence.required = true boolean enabled
- governance.errorLearning.required = true boolean enabled
- governance.releaseGate.required = true boolean enabled
- governance.rollback.required = true boolean enabled
- runtime.config.cacheSeconds = 300 number enabled
- runtime.remoteRefreshSeconds = 60 number enabled

All Version=1 and Requires Reload=false.

## Why BG145 did not read canonical source directly
A fresh Make probe using Notion connection 8997531 against canonical datasource returned:
`[404] Could not find data_source ... Make sure the relevant pages and databases are shared with your integration "Make".`

Therefore the Aug-25 Datahub mirror remains required until Make has access to the dedicated source. Do not blindly revert BG145 to canonical source.

## Root cause of Datahub corruption
BG89 `Signal Fusion Engine - delta efficient` watches newly created records in the entire Interaction Datahub and previously excluded only `Record Quality=Duplicate`.

The mirrored control-plane rows use `Data Source=Powerhouse Control Plane Runtime` and `Record Quality=Master`, so BG89 treated them as commercial opportunity records and overwrote fields that BG145 intentionally reused as its compact control contract:

- Why Now <- commercial reason
- Recommended Channel <- commercial channel
- Opportunity Score <- opportunity score
- Human Required <- commercial action flag

This converted runtime config into opportunity semantics.

## Fix
1. BG89 module 2 filter now excludes `Data Source=Powerhouse Control Plane Runtime` in addition to duplicates.
2. All 12 Datahub mirror records were restored from canonical Control Plane values.
3. A Make canary using the exact BG145 Datahub query + contract-building code returned `ok=true`, `count=12`, with all expected values and types, including cacheSeconds=300, remoteRefreshSeconds=60 and governance flags enabled.
4. Temporary canary/probe scenarios were deactivated after verification.

## Regression contract
- Commercial/opportunity engines MUST exclude system/control records by Data Source / record class before any writeback.
- A control-plane API verification MUST validate semantic key/value/type/enabled invariants, not only HTTP success, field names, count or transfer size.
- BG145 must have exactly 12 expected keys unless a deliberate versioned control-plane migration changes the contract.
- At minimum assert:
  - runtime.config.cacheSeconds enabled and numeric
  - runtime.remoteRefreshSeconds enabled and numeric
  - governance.releaseGate.required = true boolean
  - governance.rollback.required = true boolean
- System/config records must never be fed to commercial scoring merely because they share a generic Datahub schema.

## Cost implication
BG145 is called from Chrome roughly every 7–8 minutes and currently costs about 4 ops / 5 credits / ~26 KB per call. Semantic repair comes before cost tuning. The caller cadence must be re-evaluated after correct config is consumed; do not optimize request frequency using corrupted config evidence.

## Learning fingerprint
`bg145|datahub-control-mirror|commercial-scorer-corruption|2026-08-30-v1`
