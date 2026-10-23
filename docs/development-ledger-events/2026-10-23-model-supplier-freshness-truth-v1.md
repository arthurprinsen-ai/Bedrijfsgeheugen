# Development ledger — supplier evidence recency contract

- Date: 2026-10-23
- Obligation: model-supplier-freshness-truth-20261023-v1
- Lane: website
- Candidate branch: `fix/model-supplier-proof-seven-day-failclosed-20261023`
- Root cause: historical model verification status could pass a 14-day freshness limit despite all 110 model-specific receipts older than seven days.
- Change: align site eligibility, UI explanation, configuration and daily source audit on a seven-day fail-closed supplier receipt age; do not restamp.
- Canonical learning: `brain/learning/2026-10-23-model-supplier-freshness-truth-v1.json`
- Historical replay: `tests/brain-ai-model-supplier-freshness-guard-v1.test.mjs`
- Other existing test: `tests/ai-model-intelligence-freshness-v1.test.mjs`
- Security: retains source-evidence and six-claim checks, supplier review, permission and tenant attestation boundaries. No PII, provider model activation or data plane change.
- Customer truth: operational portal availability != verified vendor claim != measurable entrepreneur outcome.
- Terminal state: candidate only; protected CI, merge and production readback not yet evidenced. Do not mark green merely from code commit or preview build.
