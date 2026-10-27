# Supabase Preview applicability gate v1

The hosted Supabase GitHub integration is configured to create preview branches only when `supabase/**` changes. Legacy branch protection nevertheless requires the provider-owned `Supabase Preview` context on every pull request. That combination deadlocks non-Supabase pull requests because the provider correctly reports `skipped`.

This change adds a repository-owned, always-running applicability gate:

- non-Supabase pull requests succeed explicitly as `not applicable`;
- Supabase-changing pull requests fail closed until the exact PR head has a completed provider-owned `Supabase Preview` check from the `supabase` GitHub App with conclusion `success`;
- `skipped`, `neutral`, failure states, missing provider checks and timeouts are not accepted as hosted-preview proof.

The required-check configuration must be switched administratively from universal provider-owned `Supabase Preview` to universal repository-owned `Supabase Preview Applicability`. The provider-owned check remains authoritative only inside the applicability gate when Supabase source actually changes.
