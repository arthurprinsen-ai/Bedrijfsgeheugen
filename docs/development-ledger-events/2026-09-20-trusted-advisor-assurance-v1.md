# Trusted Advisor assurance v1

- Date: 2026-09-20
- Obligation-ID: trusted-advisor-assurance-v1
- Fingerprint: `powerhouse|trusted-advisor|assurance|v1`
- Type: product trust / AI assurance
- Symptom: Portal AI could be tenant-bound and evidence-aware without making the basis, uncertainty and verification state consistently visible to the customer.
- Root cause: trust semantics existed in truth/evidence contracts but were not a universal customer-facing presentation and answer contract.
- Change: add a universal assurance strip to Portal V2, a dedicated AI Trust Center, answer-level provenance metadata, fail-closed states, and explicit verification boundaries.
- Regression gates: Portal V2 tests, native regression, no-demo-data contract, Powerhouse Assurance, BRAIN, Required and CodeQL.
- Delivery status: RECORDED_PENDING_FINAL_DELIVERY_READBACK.
- Prevention: no material AI output may rely on persuasive wording as proof; it must expose evidence state and limitations and remain fail-closed when evidence is missing.
