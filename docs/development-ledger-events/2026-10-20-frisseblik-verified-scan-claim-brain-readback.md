# Development ledger — verified scan claim to live portal

Obligation: `portal|verified-scan-claim-to-brain-pages|20261020`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Fingerprint: `portal|verified-frisseblik-claim|canonical-brain-readback|v1`

**Observed code defect:** the portal client claims an assessment through Identity → Netlify → Supabase and receives real verified server ownership and canonical projection persistence. The scan widget called only `refresh()` on its own history element, not `portalDomainState.refresh()`. Other already open dashboards and recommendations remained stale.

**Delta:** provider-ACK-only callback to existing authenticated domain refresh, no credential or raw scan payload in event; current-principal invariant; blocked while input dirty/Brain sync pending; claim success never negated by a frontend readback error; no duplicate send.

**Evidence:** `tests/brain-bedrijfslek-portal-auth-claim-v2.test.mjs` and canonical gate `tests/brain-portal-claim-propagation-v1.test.mjs`, including denied provider proof, tenant changes, auth mismatch and readback failures.

**Status:** CANDIDATE. Independent two-tenant authenticated browser and latest production provider proof required before LIVE_PROVEN. Entire #4215 remains open.
