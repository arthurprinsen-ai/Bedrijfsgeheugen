# Delivery ledger — Mistral EU inference is not the global Mistral API

**Obligation-ID:** portal-mistral-eu-regional-inference-20261015

## Security root cause
The POWERHOUSE Mistral managed adapter previously called `api.mistral.ai` for all requests and required `route.region === AUTO`. A client wishing for `mistral-api-eu` could still have a signed global/AUTO route if sovereign policy was only set to review. Mistral's official docs distinguish the global API from the EU regional inference endpoint `api.eu.mistral.ai`.

## Implementation
- Runtime adapter connects to the EU regional hostname only for independently attested computeRegion EU. Other unrecognized geographic routes fail before egress.
- Tenant model gate refuses `mistral-api-eu` unless server-owned sovereignty profile and signed runtime receipt both specify EU.
- The provider registry must additionally include verifiable `processingRegion=EU` and residency-evidence ID matching the receipt; no customer checkbox satisfies this.
- The activation-readiness display has the same region-provisioning requirement.
- The Mistral provider-governance document now explicitly warns that the global API does not guarantee EU inference, and regional inference does not prove full EU control-plane residency.
- Brain tests cover EU endpoint routing, mismatch denial and separate provisioning evidence.

## Acceptance boundary
Protected Required CI, CodeQL, safe merge and Netlify production readback remain mandatory. No provider account, DPA, signed approval, customer consent or real inference is approved by this branch. Existing global AUTO tests remain valid only for unselected global runtime, never an EU preference.

Official documentation: https://docs.mistral.ai/inference/regional-inference
