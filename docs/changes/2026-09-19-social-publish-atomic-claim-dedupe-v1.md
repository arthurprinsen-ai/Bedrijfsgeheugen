# Duplicate social publication prevention

This change prevents two concurrent social-publisher workers from publishing the same canonical decision twice.

## What changed

Before calling Composio or Buffer, the publisher now claims the canonical row atomically by changing state from `content_ready` to `dispatching`. Only the worker that wins this compare-and-set operation may cross the external side-effect boundary. Other workers stop with `ALREADY_CLAIMED_OR_DELIVERED`.

A retryable Buffer HTTP 429 may restore `content_ready` only when the failure happened before any provider-side effect. When provider outcome is uncertain, the system must read provider truth before retrying.

## Why

The incident class was `DUPLICATE_EXTERNAL_SIDE_EFFECT`: concurrent workers could both read the same ready state and both publish before either persisted delivery state.

## Verification

The lineage includes regression coverage for the atomic claim, Buffer retry-state restoration, Instagram media proof behavior, Supabase security checks, CodeQL, Brain learning and skill projection.

## Operational rule

External publish actions are single-writer operations. Claim first, side effect second, reconcile uncertain outcomes before retry.

Obligation: `SOCIAL-DUPLICATE-PUBLISH-20260919`
Fingerprint: `social-publish-atomic-claim-dedupe-v1`
