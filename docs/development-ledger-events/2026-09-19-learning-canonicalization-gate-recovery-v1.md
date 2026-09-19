# Development ledger — learning canonicalization gate recovery v1

- Obligation-ID: powerhouse-learning-canonicalization-gate-v1
- Source lineage: PR #2289
- Recovery class: stale-head canonical delta recovery
- Root cause: the original candidate remained open while main advanced, leaving its canonicalization enforcement absent from current main.
- Prevention: recover missing unique delta onto exact current main and semantically merge shared workflow changes; never overwrite a newer shared workflow with stale branch content.
- Evidence required: bounded diff, exact-head Required/BRAIN/CodeQL/Skill Projection, protected merge, production/main readback.
- Status: RECOVERABLE_INCOMPLETE until terminal evidence proves current main.
