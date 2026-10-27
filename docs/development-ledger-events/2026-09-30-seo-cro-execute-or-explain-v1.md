# 2026-09-30 — SEO/CRO execute-or-explain

- Fingerprint: `seo-cro-execute-or-explain-v1`
- Failure class: `MATERIAL_OPPORTUNITY_REPORTED_WITHOUT_EXECUTION_OR_REJECTION_EVIDENCE`
- Canonical change: daily material SEO/CRO opportunities must terminate as `EXECUTED` or `REJECTED_WITH_EVIDENCE`.
- Recommendation-only output is a contract failure.
- Rejection requires reason_code + inspected evidence/freshness + missing/conflicting evidence + future execution condition.
- Safe reversible evidence-gated changes are executed up to the daily maximum.
- Tool/CI/deploy failures remain recovery work in the same lineage.
