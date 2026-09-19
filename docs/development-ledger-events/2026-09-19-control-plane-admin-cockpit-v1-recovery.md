# Development ledger — control-plane admin cockpit recovery

- Date: 2026-09-19
- Obligation-ID: `powerhouse-control-plane-admin-cockpit-v1`
- Recovered predecessor: PR #2317
- Rebuild base: `16aeb291a69672a98bd1ce215ae2304ec15697ca`
- Strategy: current-main union + additive obligation delta; no stale shared-file overwrite.
- Added surfaces: admin Netlify endpoint, Portal V2 cockpit, canonical projection read action, quality-surface contract and regressions.
- Security: explicit admin authorization, read-only canonical views, tenant writer authority preserved.
- Terminal requirement: exact-head gates → protected merge → provider/runtime readback → learning/skill projection → terminal evidence.
