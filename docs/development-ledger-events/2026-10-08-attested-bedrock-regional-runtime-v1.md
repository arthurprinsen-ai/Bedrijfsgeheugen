# Development ledger — AWS Bedrock signed regional runtime

- Date: 2026-10-08
- Related canonical obligation: [#4152](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4152)
- Type: implementation candidate; no external workload activated
- Changed implementation: `platform/runtime/attested-bedrock-adapter.mjs`;
  `platform/runtime/attested-cloud-ai.mjs`
- Regression: `tests/brain-attested-bedrock-regional-adapter-v1.test.mjs`
- Learning: `brain/learning/2026-10-08-attested-bedrock-regional-runtime-v1.json`
- Guarantee: provider / tenant / region / model / consent / CSRD review / signed proof
  and fixed AWS endpoint required before Bedrock transport; denies cross-region model
  IDs, missing proof and session expiry, with no retries or fallback.
- Provisional state: PR checks and subsequent release readback not yet known at ledger
  creation. Customer-owned cloud, on-prem and air-gapped acceptance evidence remains
  open; requested state is not a live runtime claim.

- Admission baseline (verified by exact-head workflow): `ce7d9993d274a0ee755993109cd3f667a93a2127`; machine metadata in PR #4213 matches baseline.
