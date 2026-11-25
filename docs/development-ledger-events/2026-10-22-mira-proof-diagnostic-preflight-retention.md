# Mira: rejected video proof must survive readiness preflight

Fingerprint: `mira|media-preflight|rejected-frame-diagnostic-reset|20261022-v1`. Parent [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439). Independent SQL proof discrepancy is already handled by [#4643](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4643); do not combine or overwrite that writer.

## Real observed failure

For the canonical Instagram obligation of 2026-10-22, actual OpenArt videos were submitted to the existing router. Their first-frame two-image identity scores were below 0.94 and the verifier correctly returned HTTP 422; the external Instagram post ID remained NULL. A later readiness preflight treated the existing downloadable video as `assetMaterialized`, reset `last_error=null`, and put `MEDIA_ASSET_REQUIRED` on the obligation. This loses the precise blocker despite immutable rejected SHA evidence remaining in `powerhouse_media_proof_evidence_v1`.

## Scoped prevention

The router now calls a bounded existing-job CAS write for an actually rejected frame, storing a precise diagnostic with frame position, source history and observed score. Both job and obligation remain blocked, no manifest is replaced, and neither attempts nor status is fabricated. Its existing readiness method retains confirmed face-verification failures and next actions while `WAITING_PROOF`; only later successful full proof may clear the error.

## Boundaries

- One canonical tenant/day/channel obligation; no second scheduler, job, registry or alternative media provider.
- Never relax the >=0.94 face identity, exact canonical master/reference, start-middle-end frame checks, temporal verification, unique post or authenticated provider readback.
- An honest `WAITING_PROOF` is not `LIVE_PROVEN`.
- Regression: `tests/brain-mira-preflight-verifier-rejection-retention.test.mjs` includes preservation, CAS, live-post denial, diagnostic consistency and unchanged fail-closed router guards.
- Only exact-head Required CI/CodeQL, protected merge, production Edge source parity and subsequent real failure/status readback allow the code-level fix to be called PROVEN; actual publishing is separately gated.

The fault belongs to this existing Instagram/media lineage, not to the unrelated [SQL performance PR #4630](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4630).
