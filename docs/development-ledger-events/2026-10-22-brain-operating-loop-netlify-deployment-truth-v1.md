# Append-only development ledger — 2026-10-22
- Fingerprint `delivery|netlify|brain-operating-loop-import-deployment-misclassified|20261022-v1`
- Observed immutable failure: GitHub run 39824197943, main `91a15517a5e02763651ec2bb2d90e1f2fd5d41f7`.
- Root cause: missing `brain/operating-loop/` prefix in canonical Netlify deployment detector.
- Fix: source applicability, runtime shape hygiene, positive/negative regression, Brain learning, skill, System Map and human documentation.
- Verified production state: PENDING, exact readback mandatory.

## Same-PR admission repair
- Exact Required run #39825113976 failed at `LEARNING_EVALUATION_FAILED`: new replay test omitted mandatory `BRAIN-DELIVERY-v2` policy and `createDeliveryPlan` threw TypeError. Corrected the original test harness to import/pass canonical `config/brain-delivery-system.json` as policy. The real deploy applicability assertions, source classifier, release security gates and prior Brain evidence logic stay unchanged. Fresh exact-head Required/CodeQL mandatory.
