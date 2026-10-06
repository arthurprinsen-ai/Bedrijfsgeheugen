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

## Provider-source proof

The GitHub App check is only deployment-phase evidence. The authority workflow now performs an independent read-only provider download after that check and compares the full downloaded function file set byte-for-byte with protected `main`.

`SUPABASE_ACCESS_TOKEN` is therefore a readback credential only. Prefer a scoped PAT limited to this production project with **Edge Functions: Read**. The workflow contains no `supabase functions deploy` command; Supabase GitHub Integration remains the sole normal production writer.
