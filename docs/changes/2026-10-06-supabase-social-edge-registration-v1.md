# Supabase Git function registration authority

Date: 2026-10-06

## Failure mode

The protected-main Supabase deployment check completed successfully while `social-recovery-runner` remained byte-different in production. The GitHub integration deploys Edge Functions declared in `supabase/config.toml`; the two social authority functions were not declared there.

## Structural fix

Both authority-critical functions are now explicit Git-managed production functions:

- `powerhouse-social-publisher`: enabled, `verify_jwt=false`, canonical entrypoint.
- `social-recovery-runner`: enabled, `verify_jwt=true`, canonical entrypoint.

A regression test fails closed if either registration or JWT mode disappears.

## Terminal rule

A successful Supabase GitHub check is necessary but no longer sufficient evidence on its own. Terminal closure requires the registered production deployment plus provider-source parity readback for the authority-critical functions.
