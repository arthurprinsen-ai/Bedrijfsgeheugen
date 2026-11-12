# Provider-applied #834 not reaching original migration lock — repair ledger

- Date: 2026-11-12
- Fingerprint: `supabase|migration-history|native-provider-834-lock-handoff|20261112-v1`
- Parent: #4198; blocked Portal release: PR #5674, Required run #43285752866.
- Root cause: original protected Git migration #834 reached production Supabase successfully but canonical source lock remained at 833, failing six protected parity assertions.
- Provider evidence: native `supabase_migrations.schema_migrations` exact version `20261112203000`, name `original_seo_keyword_tenant_alignment_v1`; executable SQL on merged main #5677. Source lock 833 entries, tail #833 `20261112194500`.
- Authorized action: append exact #834 version/name to existing source lock on one protected PR; preserve historical prefix and add a dedicated regression test, ONE BRAIN learning and skill guidance.
- Safety: no direct main write, no replay, no credential/auth/security weakening; no new executor or fake downstream ACK.
- Closure: original protected CI + main and native provider readback required. Any failure remains open with evidence; no force-green.
