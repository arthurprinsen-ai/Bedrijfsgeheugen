# Decision Twin read-only evidence receipt — 2026-10-19

Obligation-ID: `decision-twin-tenant-receipt-ui-20261019`
Fingerprint: `powerhouse|portal-v2|decision-twin-proof-receipt|v1`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Verified initial condition
Portal V2 has a scenario explorer, but the missing explicit receipt causes semantic ambiguity: a numerical "what-if" is not a provider-executed intervention or realized customer outcome.

## Causal fix candidate
Use exact tenant+goal/source matching and independently verified provider/outcome receipts to advance a five-state evidence trace; otherwise fail closed. Join only the existing portal state; never write or activate connectors. The existing route action is bound for all buttons. Tests cover empty, cross-tenant, unsupported action, fake provider, fake outcome and escaped HTML.

## Closure
No provider activation or data migration in this lineage. Source diff, protected checks, authenticated portal production route acceptance and outcome learning required before declaring deployed. If any source lacks trust, UI must keep it unknown and preserve tenant isolation.
