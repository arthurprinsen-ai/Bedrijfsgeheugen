# Social learning Edge store undeclared in production source registry — 24 October 2026

- Defect: merged source PR #4834 was fully protected, but Supabase active `social-learning-store` remained version 12 (2026-10-07) due to missing `[functions.social-learning-store]` in `supabase/config.toml`.
- Origin: protected Supabase Edge production authority explicitly requires functions to be declared; automatic deploy did not apply the changed social store.
- Repair: register existing function, enabled=true, verify_jwt=false as deployed, with SHA256 `x-bg-service-token` authentication remaining mandatory in its body.
- Ownership: existing Supabase integration and protected main. No alternate deployer, no second scheduler, no new token, no cross-tenant access.
- Proof: Required+CodeQL, Supabase Preview and production exact-source readback, then hourly evaluators create measured 24/48/72h rows instead of only missing-snapshot obligations.
