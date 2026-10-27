# Authenticated AI runtime adapters + signed provider proof

- Obligation-ID: attested-customer-ai-provider-routing-20261008-v1
- Related delivery: #4152 (remains open).
- Readback: required checks, protected merge, Netlify production deploy, signed issuer provenance and real tenant/provisioned provider end-to-end run are separate validations.
- No activation of cloud, on-prem, private endpoints, air-gapped or local AI from customer preference alone.
- Runtime chooses one provider only, matched by signed tenant/use-case/policy version and evidence. AI identity/regulatory review not silently approved.
- Tests: `tests/brain-attested-cloud-ai-adapters-v1.test.mjs`, `tests/brain-tenant-ai-inference-gateway-v1.test.mjs`.
- Scope: new platform runtime module, tenant ingress, Netlify function, tests and evidence.
