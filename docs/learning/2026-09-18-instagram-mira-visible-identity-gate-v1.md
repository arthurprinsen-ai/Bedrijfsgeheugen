# Learning — Mira visible identity gate

Date: 2026-09-18  
Fingerprint: `metadata-only-mira-identity-false-positive-v1`  
Parent delivery: PR #2020 / merge `7b3ca7bcc4a633e5c40fc37d940ddfce3890e69c`  
Status: LIVE_BEWEZEN

## Incident

Instagram post `6aacd3818448254db20613c8` was published with a generic Placid text card while runtime state had promoted the media as Mira identity `PASS`. The fallback proof contained template/layer metadata such as `layer:naam=Mira`, but no semantic proof that Mira was actually visible in the final pixels. The static asset was also 1080x1920 rather than the canonical static-feed size 1080x1350.

## Root cause

Identity truth was inferred from metadata supplied by the rendering/template pipeline instead of from the exact final media. That allowed a metadata-only false positive to survive the pre-publish path and become provider delivery truth.

## Permanent prevention

- Template name, layer label, caller flag, provider status or asset URL is never sufficient identity evidence.
- Exact final media URL and SHA must be bound before dispatch.
- Mira must be semantically verified as visibly present in the exact final pixels.
- Visual proof requires `semantic_verified=true`, `mira_present=true`, `evidence_method=vision`, `identity_class=mira_daily_life` and a `vision:*` evidence reference.
- Static Instagram feed media is exactly 1080x1350.
- Reel/video media is exactly 1080x1920.
- Video identity requires visible-Mira proof on start, middle and end frames.
- The social publisher revalidates the contract independently; upstream approval alone is insufficient.
- Release readback includes negative production probes so known-invalid metadata-only and wrong-dimension inputs are proven blocked.
- A failed identity gate never regenerates or republishes the incident artifact merely to reach green.

## Production evidence

Protected main contains PR #2020 as merge `7b3ca7bcc4a633e5c40fc37d940ddfce3890e69c`.

Production functions:
- `bg-pre-publish-review` v10
- `powerhouse-social-publisher` v12
- `powerhouse-content-orchestrator` v13

Readback:
- request 396 -> HTTP 422 -> `INSTAGRAM_MIRA_VISIBLE_IDENTITY_REQUIRED`
- request 397 -> HTTP 422 -> `INSTAGRAM_STATIC_DIMENSIONS_INVALID`
- incident obligation remains `BLOCKED` with `live_proven_invalidated=true`

## Powerhouse/skill promotion

This learning is promoted to reusable skill `Instagram Mira Visible Identity Gate v1`. The skill is a projection of the existing Powerhouse Brain learning authority, not a second truth store. It is covered by the existing daily self-evolution surface `docs/superpowers`.

