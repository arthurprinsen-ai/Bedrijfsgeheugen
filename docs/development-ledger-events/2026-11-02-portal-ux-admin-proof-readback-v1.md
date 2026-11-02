# 2026-11-02 — Original admin-only Living Interface UX proof panel

Parent #4547; obligation `portal-v2-original-admin-ux-proof-20261102-v1`. Current protected base `f6bdde643a7db3605f9213f73510be23b8e1c382`.

The original Powerhouse administrator already has `/api/powerhouse-observability` and a System Map with aggregate ONE BRAIN incident coverage, but not a source-derived display of the recorded V1 Living Interface production observation. This is an operational visibility gap: verified technical deployment must not imply WCAG, usability, two-tenant onboarding or award qualification.

**Implementation:** no new portal, table, scheduler or writer. Read only the newest matching `public.brain_observed_states` record for `portal-v2-living-interface-ux-v1` via the original Supabase service credential inside the existing authenticated admin+tenant endpoint. Project an exact minimal allowlist of status strings, source SHA, source timestamp and expiry; never include raw `evidence` from the database, private incident IDs, secrets, tenant/customer data or actor details. Verify valid SHA/version/freshness. In the existing System Map, compare the registered SHA with the independent Netlify published SHA already loaded by the original provider evidence path. Stale or mismatched state is not green; accepted metrics without independent proof remain EVIDENCE_DUE.

**Regression:** `tests/brain-portal-ux-admin-proof-readback-20261102.test.mjs`; original protected Required, CodeQL, BRAIN, System Map and browser acceptance remain fail-closed. This is a candidate, not proof of authorization effectiveness, screenreader compliance, business ROI or an actually rendered authenticated panel. Rollback: revert candidate by protected release owner; original incident list remains intact.

**Original mistake and prevention:** the product status observation was written server-side but never shown in the original administrative interface. Every future UX release needs a server-side allowlisted status projection with independent live identity and an authenticated operator readback. Do not display raw incident details or hide missing evidence.
