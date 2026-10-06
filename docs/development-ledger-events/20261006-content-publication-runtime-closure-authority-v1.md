# 2026-10-06 — content publication closure authority alignment

- Observed #3858 failing preflight after integration closure had already returned `ready=true` with authority `canonical-runtime-obligation`.
- Root cause: Required test unconditionally invoked the older standalone material-writeback guard.
- Added an explicit runtime publication path allowlist to the integration policy.
- Runtime authority now requires both the canonical obligation prefix and a pure allowlisted publication path set.
- Required test skips the duplicate standalone guard only when the integration bundle emits `canonical-runtime-obligation`.
- Added regression coverage proving mixed publication/control-plane changes remain fail-closed.
