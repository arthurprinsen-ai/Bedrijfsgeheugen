# Supabase migration repair list parser v3

## Incident
Trusted-main run 37425004020 reached production through the GitHub OIDC database bridge and passed the exact recovery allowlist/effect-evidence gates. It then stopped before mutation with `REMOTE_ONLY_OR_IDENTITY_DRIFT`.

The provider output itself showed exactly the four expected local-only replay baselines. Supabase CLI renders an empty remote cell as ` ` (backtick, space, backtick). The v2 parser trimmed before removing backticks; after delimiter removal one space remained, so `x.remote` was truthy.

## Structural fix
- normalize each migration-list cell as `trim -> strip surrounding backticks -> trim`;
- use the same normalization before and after supported repair;
- regression-test the exact ` ` empty-cell representation from the trusted run;
- retain the exact four-version allowlist and every fail-closed drift check.

No migration SQL is executed by this parser fix. No direct write to `supabase_migrations` is introduced.

## Terminal contract
This only repairs trusted control-plane parsing. #3742 remains open until supported provider repair succeeds, post-repair migration-list drift is zero, #3766 exact-HEAD gates are green, protected merge completes, and post-merge production readback is proven.
