# Supabase migration repair list parser v2

## Incident
The trusted-main migration repair control reached the production database through GitHub OIDC, but failed closed before mutation. Supabase CLI renders migration-list versions wrapped in backticks; the parser expected bare 14-digit versions and therefore misread the visible four-version local-only drift as an empty drift set.

## Structural fix
- normalize migration-list cells by trimming whitespace and surrounding backticks;
- use the same parser before and after supported migration repair;
- retain the exact four-version allowlist;
- retain the rule that any remote-only or unexpected identity drift is fatal;
- retain supported `supabase migration repair ... --status applied` as the only production tracking mutation.

No migration SQL is executed by this fix and there are no direct writes to `supabase_migrations`.

## Terminal contract
This parser fix only enables the existing trusted repair control. #3742 remains fail-closed until provider repair succeeds, production ledger readback proves all four identities, #3766 exact-HEAD gates are green, protected merge completes, and post-merge production readback is proven.
