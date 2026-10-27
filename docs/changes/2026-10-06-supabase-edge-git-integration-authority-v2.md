# Supabase Edge protected-main Git integration authority v2

## Problem

PR #3898 correctly prohibited out-of-band Supabase Edge production writes, but its GitHub Actions workflow still tried to become a second provider writer. The first protected-main run failed before deployment because `SUPABASE_ACCESS_TOKEN` was empty.

Adding a long-lived PAT would restore execution, but it would also preserve two production mutation routes: the existing Supabase GitHub Integration and a separate CLI writer.

## Structural repair

- Keep protected Git `main` as the only source authority.
- Use the already-connected Supabase GitHub Integration with **Deploy to production** as the only normal Edge Function provider-deployer.
- Convert `.github/workflows/supabase-edge-production-authority.yml` to attestation-only.
- Bind attestation to the newest Supabase GitHub App check on the exact protected-main SHA and exact production project URL.
- Require the same successful provider check id to be observed twice before accepting it.
- Record deterministic source-tree SHA-256 identities for every affected function.
- Re-check `main` after provider success and fail if a newer Supabase runtime/config change has superseded the attested SHA.
- Remove the normal-path requirement for `SUPABASE_ACCESS_TOKEN`, Supabase CLI setup, deploy and download.

## Safety

Direct chat, agent, dashboard and CLI production deploys remain forbidden outside explicit break-glass. Missing provider proof remains fail-closed. This reduces production writers from two to one instead of weakening delivery proof.
