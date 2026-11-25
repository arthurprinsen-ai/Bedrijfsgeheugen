# Development ledger — #4215 legacy BusinessInput tenant boundary

- Date: 2026-10-09
- Obligation-ID: `p0-4215-legacy-business-input-tenant-20261009-v1`
- Parent-P0: #4215
- Failure class: `PORTAL_LEGACY_CROSS_TENANT_BUSINESS_INPUT_WRITE`
- Root cause: full localStorage scan, any-user existence trigger and all-record BusinessInput migration under current session.
- Source authority: existing `readLegacyPortalStateForUser`, `portal-v2/domain-state.js`, `portal-v2/business-input-store.js`.
- Fix: exact normalized current-user cache entry only, missing auth fail-closed, same authoritative server write.
- Test replay: `tests/brain-p0-4215-legacy-business-input-tenant-isolation-v1.test.mjs` and existing portal domain/business-input suites.
- Prevention: require user identity for both reader and standalone migration, never enumerate `bg_portaal_*` for a customer write.
- Verification boundary: protected tests do not prove two genuinely authorized customer tenants, retry durability or legal applicability.
