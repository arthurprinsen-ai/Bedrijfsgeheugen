# Recovery — admin-only Powerhouse Control Center

The Control Center security implementation is already on main from PR #2448. This recovery closes the governance evidence around that implementation.

The skill compiler rejected the first version because security-sensitive learning requires more than a normal replay/canary pair: it also requires shadow evaluation. The recovery now uses two executable security regressions for all three evaluation modes.

No authorization is relaxed by this recovery. The dedicated observability endpoint remains fail-closed, requires Netlify Identity and server-side admin authorization, and the UI does not fall back to the ordinary Brain API.

This recovery is complete only after the material writeback guard, skill projection, Required, BRAIN and CodeQL all pass.
