# 10 November 2026 — canonical BRAIN runtime readback into every open native page
Owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215 ; UX: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547.

## Source defect
The original Powerhouse runtime bridge refreshes the authenticated `portal.runtime` read model, but already-open native detail pages only listen to local edits, BRAIN write ACK and server state snapshots; a new runtime projection did not invalidate them. The identity boundary was also not consumed by the page shell, leaving mounted private customer content in a closed or stale pane.

## One-chain repair
Listen to the two original BRAIN/Powerhouse runtime events on the existing native shell. Compare the actual latest read-only projection; do not remount for unchanged 45-second polls. Recheck account, route, pending form state and active editors inside the original animation-frame scheduling. On original identity boundary, close and wipe mounted native content, impacts, and auxiliary widgets. No second data source, storage, scheduler, approval or invented recommendations.

## Evidence and limits
Pure policy and source binding regressions in `tests/brain-portal-live-runtime-propagation-20261110.test.mjs`. Exact protected Required + CodeQL, original Netlify deploy readback, and real two-tenant browser readback are separate. This does not prove durable browser-restart handoffs, source-to-Heartbeat execution, measured outcomes or learning.
