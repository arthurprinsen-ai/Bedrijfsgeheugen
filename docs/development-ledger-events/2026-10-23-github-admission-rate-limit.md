# Delivery ledger — GitHub admission capacity evidence

- Date: 2026-10-23
- Fingerprint: `github|ci-admission|installation-wide-rate-limit-403-misclassified|20261023-v1`
- Source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39940982668
- Root: exhausted GitHub app installation quota was classified as a generic permanent control-plane rejection
- Remedy: pure source-backed classifier, no immediate rate-limit retry, canonical stable incident fingerprint and recovery hint
- No additional API GET, cron, scheduler, agent writer, database or CI bypass
- Tests: `tests/brain-ci-installation-rate-limit-classifier-v1.test.mjs`
- Release: protected exact-head Required and CodeQL; keep role/tenant/auth controls unchanged; runtime not yet proven
