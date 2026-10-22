# Portal canonical refresh recovery — 2026-10-20
Obligation: `portal|safe-server-revalidation|20261020`.
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

**Source of truth:** existing Supabase tenant state, authenticated via Netlify Identity; no new caching database/cron. **Owner:** Portal V2, ONE BRAIN.

**Reproduction:** app init only on identity login/logout, otherwise domain subscription was local-only. Server change during an open page had no authenticated readback; calling init as a workaround would destroy dirty state.

**Delta:** guarded refresh in existing domain-state; same customer identity throughout flight; no pending state/Brain ACK; provider failure preserves last verified snapshot; visibility and 15-minute browser revalidation; derived-page rerender without overriding focused form editing. All affected route/domain calculation contracts remain in place.

**Regression:** `tests/brain-portal-live-revalidation-v1.test.mjs` including changed vs unchanged, dirty and simultaneous edit, failing provider, principal change, pending BusinessInput ACK, and navigation/visibility wiring.

**State:** CANDIDATE pending protected merge, immutable deployment and authenticated browser/tenant readbacks. Parent P0 requires full form matrix and real revenue/outcome lineage independently; this delta cannot close it.
