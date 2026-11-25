# Netlify READY deployments with unauthenticated synthetic release commits — source guard

Date: 2026-11-05  
Original owner: existing GitHub/Netlify protected production release authority  
Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447  
Status: SOURCE_FIX_CANDIDATE; PRODUCTION_RECURSION_PROOF_DUE

## Source evidence
Netlify READY deployments `6aec3e3e888a4e2164417f68` and `6aec4257f095e98c3864f875` published `release.json` identities `a1b6fcae4103e0d74cd25f288da1c75ca5535cad` and `14fbc8ede60b0fcda6bbd156064426a632f62032`, while provider metadata carried `commit_ref=null`; GitHub repository commit lookup returned 422 for both. Their temporary publication overtook actual main-backed deployments. Later READY deployment `6aec43b3eab087e40ffd88ce` was read back with exact current protected main commit `9f8e4367e52fb9d8f737f82fbc83fa807b1bd3f6`; this does not prove recurrence prevention.

## Likely defect and safe source correction
The original `tools/bouw-release-evidence.mjs` already resolves a source SHA from provider `COMMIT_REF`/HEAD or immutable `.bg-source-commit`, with contradiction rejection. Yet `tools/ci/netlify-build-entry.mjs` subsequently overwrote release.json using `providedCommit||gitHead`. A valid 40-hex local synthetic Git HEAD can therefore replace the earlier source identity at final restamp.

In the SAME Netlify build authority, `resolveFinalReleaseIdentity` now checks that final restamp equals prior release evidence; prefers attested provider/marker; allows a provider-HEAD-only native fallback only for exact canonical GitHub origin with matching checkout HEAD and origin/main. Missing or contradictory proof fails closed. Existing protected Git branch, OIDC provider, Netlify build parity, original writer and browser checks remain unchanged. This candidate does **not** assert that all prior anomalous deploys definitely came from that path until provider build logs identify the publisher.

## Regressions and evidence completion
New tests `tests/brain-netlify-final-source-identity-attestation-20261105.test.mjs` cover eight cases: attested API marker, COMMIT_REF source, contradictory previous release, synthetic HEAD rejection, legitimate native Git fallback, remote/main mismatch, marker conflicts, original builder contract. No blanket deploy retries, second workflow, disabling preview requirements or hardcoded commit IDs.

Require original exact-head Required, CodeQL and full BRAIN, Netlify provider preview, protected merge, production Git integration release, independently matched canonical+immutable release.json and original browser readback. The actual provider writer identity plus one natural production interval without recurrence is still required before structural closure. Do not mark green based on source-only tests.
