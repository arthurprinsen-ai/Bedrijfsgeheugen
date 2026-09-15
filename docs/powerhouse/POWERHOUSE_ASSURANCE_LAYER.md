# Powerhouse Assurance Layer

Canonical fingerprint: `powerhouse-assurance-layer-v1`

## Purpose

The Powerhouse Assurance Layer makes completeness, evidence and documentation enforceable properties of the existing Bedrijfsgeheugen Powerhouse. It is a control-plane capability only: it does not become a second runtime, database, learning store, portal authority or business-data source.

## Authorities

- Runtime/data truth: existing Supabase/Powerhouse stores.
- Provider execution truth: the provider that performed the action.
- Code/release truth: GitHub current `main`, required/relevant checks and exact merged SHA.
- Website/portal delivery truth: Netlify deployment plus public production readback.
- Human knowledge/audit truth: the canonical Notion System Map, Menselijk Handboek and specialist runbooks.
- Learning truth: existing Powerhouse error/outcome/forecast/calibration lineage.

## Machine-readable registry

`powerhouse/assurance/component-registry.json` describes the assurance contract for production-affecting component families. Fleet records deliberately cover homogeneous surfaces such as GitHub workflows, Netlify functions and Supabase Edge Functions; repository drift discovery expands those families into actual files and fails when a discovered file is outside every declared code-path contract.

Each active/experimental record must declare authority, owner, code/runtime surfaces, documentation, dependencies, data contract, security, observability, recovery, cost/capacity, tests, evidence, learning lineage and last verification time.

Lifecycle values are `experimental`, `active`, `deprecated`, `retired` or `superseded`. Deprecated/superseded entries need explicit retirement or migration evidence.

## Two kinds of failure

The validator intentionally separates two classes:

1. **Blocking contract gaps** — malformed/missing required metadata, duplicate canonical IDs, invalid lifecycle/parity status, unregistered repository production surfaces. These fail CI.
2. **Managed evidence obligations** — the contract is structurally valid but external proof is not yet strong enough, for example an unexecuted destructive recovery drill or Portal V2 production-interaction proof. These do not get silently promoted to green. They keep the report status at `DEELS LIVE` and must remain visible as open obligations until direct evidence exists.

This separation exists so the control plane itself can be deployed without lying about operational evidence. It is not a bypass: `LIVE & BEWEZEN` requires zero blocking gaps **and** zero open evidence obligations.

## Portal V2 parity

`powerhouse/assurance/portal-v2-parity.json` maps the 24 protected legacy portal capabilities to Portal V2 and the existing Powerhouse authority/writeback model. `status=verified` means code/contract parity was proven by the existing protected baseline and V2 inventory. It does **not** imply end-user production interaction proof.

`production_evidence_status` is therefore tracked separately:

- `verified`: direct production evidence exists.
- `pending`: contract parity is present but direct production interaction evidence is still an open obligation.
- `retired`: capability is intentionally retired and must include retirement evidence.

## Drift detection

The assurance CLI scans configured production-owned repository roots and matches every discovered file against registered `code_paths`. Any unmatched production surface becomes a blocking drift gap. Provider/runtime discovery requiring credentials remains the job of existing Powerhouse schedulers/readbacks; CI never fabricates provider state.

## Recovery semantics

Recovery documentation and recovery testing are different things. A rollback procedure is not a successful recovery drill. Critical components with only documented recovery create a managed evidence obligation and therefore cannot contribute to a global `LIVE & BEWEZEN` claim.

Destructive production recovery drills must never be performed merely to satisfy a documentation check. They require the existing safe operational route, rollback boundary and evidence capture.

## CI

`.github/workflows/powerhouse-assurance.yml` runs:

1. Node assurance contract tests.
2. The deterministic assurance CLI with `--check`.
3. The pre-existing Portal V2 protected baseline.

The CLI returns a non-zero exit for blocking contract/drift gaps. Managed evidence obligations are emitted in the report and hold the status at `DEELS LIVE` while allowing the assurance machinery itself to be deployed and used to drive closure.

## Status contract

The report uses the existing Powerhouse status vocabulary:

- `LIVE & BEWEZEN`: zero blocking gaps and zero managed evidence obligations.
- `DEELS LIVE`: the assurance contract can run but evidence obligations or gaps remain.

A chat/agent may never reinterpret a green CI gate as proof that every external production outcome is green. Provider/runtime/browser evidence remains separately required.

## Change closure

For every structural change:

`runtime/code -> tests/gates -> deploy/execution -> production/provider readback -> current state -> System Map -> Menselijk Handboek/runbook -> outcome/learning/calibration -> documentation coverage check`

Documentation drift is itself a defect. New production-affecting surfaces must be added to the existing registry contract or CI must fail.
