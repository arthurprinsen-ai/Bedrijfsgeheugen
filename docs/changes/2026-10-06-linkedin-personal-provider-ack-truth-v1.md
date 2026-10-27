# LinkedIn personal provider-ack truth recovery

Date: 2026-10-06

## Problem

The canonical LinkedIn personal post was created successfully and has a durable provider ID, but the later `GET_POST_CONTENT` readback is permission-limited by LinkedIn. The recovery runner still required `provider_truth_verified=true` for every channel, so it could remain AMBER even though the publisher had already proven the side effect and marked it non-repeatable.

## Structural rule

Exact provider readback remains the default terminal proof. Only `linkedin_personal` may use a permission-bound create acknowledgement as provider side-effect truth, and only when all of these are true:

- `provider_create_success=true`
- `provider_publication_ack_verified=true`
- `readback_permission_limited=true`
- `republish_forbidden=true`
- a durable `external_id` exists

LinkedIn company and Instagram continue to require exact `provider_truth_verified=true`.

## Safety

A bare provider ID, canonical database state, or `published` status is never sufficient. This exception cannot authorize another publish; it only prevents a confirmed existing side effect from being falsely treated as unproven.

## Verification

Regression coverage: `tests/brain-central-social-publication-authority-v1.test.mjs`.

Terminal path: protected merge -> Supabase GitHub production deployment/attestation -> exact source parity -> canonical social recovery -> provider-side-effect truth readback.
