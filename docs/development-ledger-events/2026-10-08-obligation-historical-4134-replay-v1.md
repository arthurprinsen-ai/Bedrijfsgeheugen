# Development ledger: PR #4134 terminal closure and duplicate replay retirement

- Date: 2026-10-08
- Obligation-ID: historical-terminal-replay-4134-20261008-v1
- Original obligation: linkedin-cross-workspace-auth-proof-20261008-v1
- Original merge SHA: f8c7f313be234da58326a399d45b5866ff13ca59
- **Original closure verified**: GitHub run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37768018373, conclusion success.
- **Durable proof**: Supabase `brain_obligations.state = FULFILLED`, original PR `Terminal-State: LIVE_BEWEZEN`, artifact `obligation-terminal-evidence-4134`, digest sha256:521c6993abad495094bb553e7a23f2a4b1455f132cbf72ff280a1c448fe1ca1a.
- **Duplicate failed replay**: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37768605469, `OIDC_WORKFLOW_REJECTED` after gates passed.
- **Root cause**: called workflow inherited caller identity; protected production evidence writer accepts the canonical direct workflow_ref.
- **Remediation**: remove spent marker, duplicate historical job and workflow_call entry; preserve canonical direct closure gates and provider readback. Regression: `tests/brain-obligation-historical-4134-replay.test.mjs`.
- **Security**: no auth policy broadening, bypass, direct SQL state write or rewriting historical runs.
- **Final acceptance**: protected CI green, protected merge, main readback of removed duplicate, Brain original still FULFILLED.
- **Current state**: PROVEN_TERMINAL_ORIGINAL; CLEANUP_PENDING_PROTECTED_DELIVERY.
