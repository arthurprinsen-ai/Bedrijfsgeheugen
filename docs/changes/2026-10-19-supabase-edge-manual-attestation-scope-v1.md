# Supabase Edge production authority: require explicit manual attestation scope

## Why
The production authority workflow correctly fails on an invalid GitHub Actions Supabase PAT. Separately, its manual dispatch defaults an omitted `functions` input to a diff of the latest main commit. When current main only changes Portal code, the Edge function set is empty and parity is skipped as not applicable. This could incorrectly be interpreted as evidence the credential was repaired.

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4396

## Change
The existing `.github/workflows/supabase-edge-production-authority.yml` now requires `functions` on manual runs, with an independent fail-closed guard for empty or whitespace inputs. A focused regression check in a dedicated non-vacuous dispatch test locks in this behavior. Push-triggered source scope resolution, protected main, existing Supabase GitHub deployment integration, real byte comparison and explicit credential failures remain unchanged.

## Follow-up
This pull request is **not** a replacement for the revoked/invalid personal access token. CI, CodeQL and protected merge must pass before the guard is considered deployed. The Supabase account owner must generate a project-scoped PAT with Edge Functions Read, save it only as GitHub Actions repository secret `SUPABASE_ACCESS_TOKEN`, and run the same authority workflow with explicit `functions=netlify-deploy-bridge`. The incident is closed only after the actual workflow and independent source verification are green. No Netlify redeployment is required for this CI-only change.
