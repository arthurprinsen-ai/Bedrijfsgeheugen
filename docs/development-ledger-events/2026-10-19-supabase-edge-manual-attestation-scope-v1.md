# Fail closed on empty manual Supabase Edge parity scope — 19 October 2026

Obligation-ID: `supabase-edge-manual-non-vacuous-readback-20261019`
Fingerprint: `supabase|edge-authority|manual-dispatch|vacuous-green|20261019`
Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4396
Candidate PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4472

## Observed failure and root cause
The latest independently observed GitHub Supabase Edge Production Authority workflow run 39236976601 failed on the required provider byte-for-byte source parity step due to HTTP 401 Invalid access token. The GitHub repository Actions secret SUPABASE_ACCESS_TOKEN was last confirmed updated 2026-10-06; this candidate does **not** renew or replace it. Manual connected-Supabase provider source readback separately matched 21/21 registered Edge entrypoints and their returned support files with protected main; that is **not** proof the failed GitHub check passed.

The existing `workflow_dispatch` accepted empty `functions`, deriving from the newest main commit when the input was blank. A Portal-only commit yields no Edge runtime changes and `applicable=false`; a manual run could thus succeed without reaching token authentication or provider parity. This is a real false-green risk during token rotation.

## Narrow preventive repair
Require a nonempty function selection in the workflow dispatch schema, reject whitespace-only manual inputs with `SUPABASE_EDGE_MANUAL_SCOPE_REQUIRED`, and assert the fail-closed invariant in `tests/supabase-edge-manual-attestation-scope.test.mjs`. Preserve push-only automatic scope derivation, trusted-main ancestry, source hash capture, Supabase Preview observation, CLI version pin, project ref, read-only token, byte-parity and GitHub integration deployment ownership. No site/portal/Netlify runtime source is changed.

## Validation and acceptance
Targeted test: `node --test tests/supabase-edge-manual-attestation-scope.test.mjs`. At creation, Required/CodeQL and protected PR merge are **pending**. Independently repair the Supabase account scoped Management API personal access token, replace the encrypted GitHub repository secret via authorized settings, then dispatch **on latest protected main** with `functions=netlify-deploy-bridge` and confirm an actual successful provider download, all file equality, provider metadata and final green workflow. No blank/no-op run, no token in logs, no bypass of release checks, no Netlify redeploy.
