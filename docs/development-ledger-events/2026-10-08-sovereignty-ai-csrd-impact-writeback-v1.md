# AI sovereignty → CSRD impact integration

- Obligation-ID: sovereignty-ai-csrd-impact-writeback-20261008-v1
- Change-Scope: One Brain regulatory adapter, Netlify policy ingress, EU Edge authority, schema/atomic audit trigger, backend regression.
- Data classification: tenant policy + request provenance; avoid storing business document contents or AI prompts.
- Controls: tenant identity, optimistic version, immutable audit row, unknown ESRS materiality, no automatic activation.
- Readback: SQL migration + Edge deployed version + authenticated policy mutation/readback not yet proven at PR creation.
- Outcome: prevent silent cross-domain changes when model/provider/region preference is saved.
