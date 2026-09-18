# Powerhouse deterministic control plane — vertical slice v1

Obligation: `powerhouse-control-plane-vertical-slice-v1` (GitHub issue #2172).

## Existing canonical components reused

The implementation does not add a second Brain or lifecycle store. It composes the existing GitHub delivery state machine, `brain_obligations`, `brain_operations`, `brain_control_plane_bindings`, append-only `brain_delivery_evidence`, the existing reconciliation layer, Netlify production runtime, Production Release Readback and Powerhouse Skill Projection.

## Gap closed

Before this change, a merged PR could reach the terminal-closure workflow after production readback and skill projection, but the final terminal proof was primarily a GitHub artifact/PR-body projection. Those artifacts have finite retention and were not themselves the canonical durable Brain evidence record.

The terminalizer now requests a GitHub Actions OIDC identity scoped to the exact repository and terminal-closure workflow. The production Netlify endpoint validates issuer, audience, repository, workflow lineage, time validity and RSA signature against GitHub's OIDC JWKS. Only then can it write through the existing Supabase service boundary.

The endpoint idempotently creates/reads the canonical obligation and operation, verifies the terminal operation, appends `brain_delivery_evidence`, transitions the obligation to `FULFILLED`, and performs a durable readback. The GitHub workflow may only project `LIVE_BEWEZEN` after that readback succeeds.

## Terminal invariant

`LIVE_BEWEZEN` is a projection of machine evidence, not an agent assertion.

Required chain:

`USER_INTENT -> OBLIGATION -> EXECUTION -> PROD_READBACK -> LEARNING/SKILL_PROJECTION -> DURABLE_EVIDENCE -> FULFILLED -> LIVE_BEWEZEN projection`

A failure in OIDC validation, production readback, skill projection, durable persistence, or readback fails closed and prevents the terminal claim.

## Production authority

The retired Make transport was still configured as the primary BG169 transport. This contradicted current Powerhouse operation. The canonical production authority is now `github-native` only; Make is not an active production delivery or fallback path.
