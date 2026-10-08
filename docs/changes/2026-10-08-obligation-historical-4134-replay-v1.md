# Historical terminal PR #4134 — final reconciliation

## Verified original closure
- Original obligation: `linkedin-cross-workspace-auth-proof-20261008-v1`.
- Original merge: `f8c7f313be234da58326a399d45b5866ff13ca59`.
- Original [direct canonical terminal workflow](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37768018373): completed successfully, and saved `Writer-Lease-State: RELEASED` plus `Terminal-State: LIVE_BEWEZEN` to original PR.
- Immutable artifact: `obligation-terminal-evidence-4134`, digest `sha256:521c6993abad495094bb553e7a23f2a4b1455f132cbf72ff280a1c448fe1ca1`.
- Brain evidence: `brain_obligations` recorded `FULFILLED`, provider readback verified, active Supabase source v30 SHA-256 `81d9afb45a6a27e0117718219f18d87edcbcf13c0b986f880740f7b1b2e559db` at closure.

## Duplicate recovery failure
- [Historic failed first attempt](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37760879023) remains in audit history.
- PR #4153 introduced a one-time wrapper in Historical Terminal Reconciliation. Its [duplicate run](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37768605469) passed the source, gate, provider and projection checks but failed on `OIDC_WORKFLOW_REJECTED`. The caller workflow identity, rather than the canonical direct terminal workflow identity, was present in the GitHub OIDC claims. Do not broaden the trusted OIDC allowlist.

## Final cleanup
Remove the one-time marker and wrapper jobs from Historical Terminal Reconciliation, restore the existing direct `pull_request` and `workflow_dispatch` closure interface, and retain full provider/Netlify scoped-readback protection introduced by PRs #4142 and #4146. The regression test ensures the duplicate path is absent.

The original terminal state remains `FULFILLED` irrespective of this code cleanup. Completion of cleanup requires protected CI, merge and code readback; do not report successful cleanup until verified.
