# Supabase Edge single-writer byte-readback authority v3

## Escaped defect

Authority v2 accepted the Supabase GitHub App production check as terminal provider proof. That contract was falsified on protected merge `c868595e92ba5fa290de1dfb1eed632ec344802f`: the Supabase check was successful and the GitHub attestation job completed green, but direct Supabase provider readback still returned the previous `social-recovery-runner` source.

The check payload had no function list, source hash or deployed-source identity. A green integration check therefore cannot prove Edge Function source parity.

## Structural repair

- Protected Git `main` remains the sole source authority.
- `.github/workflows/supabase-edge-production-authority.yml` becomes the sole normal production writer.
- The workflow uses pinned Supabase CLI `2.119.0` and `SUPABASE_ACCESS_TOKEN`.
- Prefer a scoped PAT limited to project `adhjwmvyoixzjtmiroln` with **Edge Functions: Read-write**; Supabase documents scoped PATs as public alpha.
- The workflow discovers CLI flags through `--help` before mutation.
- Every deploy is immediately downloaded from Supabase.
- Local and provider function trees must have the identical file set, identical bytes and identical deterministic SHA-256 tree identity.
- The Supabase GitHub App check is advisory only and never terminal proof.
- `powerhouse-social-publisher` and `social-recovery-runner` are one coupled deployment unit.
- Direct chat/agent/MCP/dashboard/local-CLI production mutation remains forbidden outside break-glass.

## Terminal contract

`protected merge -> sole-writer deploy -> provider download -> byte-for-byte tree parity -> no newer runtime change`.

Missing credentials or any source/readback drift fails closed.
