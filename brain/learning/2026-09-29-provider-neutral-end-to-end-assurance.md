# Provider-neutral end-to-end assurance — 2026-09-29

## Learning

A successful scheduler, CI run or provider acknowledgement is not sufficient proof that a Powerhouse capability works. GREEN requires current read-after-write evidence at the capability boundary.

## Changes

- Required evidence-source coverage is provider-neutral for external intelligence.
- Tavily is an optional producer, not a whole-Brain single point of failure.
- `external-intelligence` is the required capability contract; verified governed producers such as DataForSEO may satisfy it.
- Buffer remains legacy telemetry only and cannot block the canonical daily loop.
- Composio/Meta remain publication authority for governed social paths.
- Existing fail-closed semantics remain: absence of current evidence is never GREEN.
- External assurance runs daily in addition to server-side health, evidence and full-cycle schedulers.

## Closure contract

signal → decision → action → execution → external readback → outcome → measurement → learning → guard

Every stage must preserve correlation/evidence. Hard provider boundaries stay RED/AMBER until actually resolved; they are never hidden by health-policy changes.
