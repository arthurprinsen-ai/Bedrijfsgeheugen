# P0 #4215 — tenant-scoped legacy compliance adapter

## Observed defect

Legacy `readPortalComplianceInput` enumerated every `bg_portaal_*` browser storage key and would use a solitary cached record even without a matching current customer. A partial `customerSlug` match was also allowed. This could project stale or other-customer local policy information as current compliance evidence after an account switch.

## Existing-state bounded fix

Reuse the already-implemented canonical `readLegacyPortalStateForUser` in `portal-v2/legacy-state-migration.js`. It requires a current-user email and only reads the exact normalized `bg_portaal_<email>` key. The compliance adapter receives this identity only via explicit `BG_COMPLIANCE_CONTEXT.authenticatedUser`; when absent, legacy data stays UNKNOWN. This is *not* server-authoritative user authentication: actual access permissions remain on the existing server. Direct current compliance projections remain unchanged. No new identity store, duplicate tenant registry, Brain or executor.

## Tests and proof boundary

`node --test tests/brain-p0-4215-legacy-compliance-tenant-isolation-v1.test.mjs tests/portal-compliance-command-center.test.mjs tests/portal-compliance-command-center-integration.test.mjs`

Negative tests include missing user context, wrong tenant, substring collisions, malformed JSON and reserved storage keys; positive tests confirm normalized exact key only and direct projection priority.

Protected CI and production Netlify release are independent prerequisites. This guards browser fallback leakage, but **does not** establish two genuinely authenticated provider-side customer transactions or full P0 #4215 closure.
