# Development ledger — #4215 fail-closed legacy compliance identity

- Obligation-ID: `p0-4215-legacy-compliance-exact-user-20261009-v1`
- Date: 2026-10-09
- Parent-P0: #4215
- Failure class: `PORTAL_LEGACY_CROSS_TENANT_FALLBACK`
- Observed: compliance localStorage scan reused unmatched sole `bg_portaal_*` record, and `customerSlug` used a substring comparison instead of exact canonical identity.
- Root cause: duplicate legacy customer storage resolver diverged from `readLegacyPortalStateForUser`.
- Repair: reuse canonical exact-email resolver requiring explicit user identity; missing identity fails closed to unknown, never data from another cached customer.
- Prevention: regression covers unscoped singleton, different-user cache, near-collision prefix, malformed key, current-user exact match, existing direct projection priority.
- Human governance: browser identity gating is not proof of signed-in provider readback or statutory CSRD/ESRS applicability.
