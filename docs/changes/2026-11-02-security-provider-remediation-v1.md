# Security Agent — bounded provider recovery and source proof

Date: 2026-11-02. Candidate in the original protected Security Agent lineage. This is **not** a provider fix or production security certification.

## Why this change exists
A deployment can be correctly built and still leave a provider access-control setting or elevated backend execution path unresolved. A denied provider write, partial inventory or token check cannot independently establish a safe outcome. Retrying the same denied mutation can create misleading logs and never close the original business risk.

## Changed behavior
The existing agent registry and skill now explicitly require: classify a denied/unsupported provider action; stop repeat attempts; escalate the necessary operator-only control-plane step; keep the original source observation negative; require anonymous-denial readback and a current provider configuration inspection before closing. Privileged backend hardening requires a verified upstream caller and rollback plan first, then original caller smoke-test plus independent provider advisor readback. No new scheduler, token, database schema, public UI endpoint or duplicate agent.

## Evidence and scope
Provider-specific assets, security observations, incidents, credentials and implementation detail remain in the **existing private** ONE BRAIN incident and trust observation store, not this public source document. The entrepreneur-facing compass continues to show plain-language risk, owner and evidence freshness without sensitive findings. A live portal and a fully resolved risk are distinct states.

## Verification
Regression: `tests/brain-security-provider-remediation-v1.test.mjs`. Existing compass and private trust suites remain mandatory. Protected exact-HEAD Required, CodeQL, full BRAIN, writer lease and production/provider readback are necessary for live claim. The two unresolved provider controls remain open until verified by their original independent sources.
