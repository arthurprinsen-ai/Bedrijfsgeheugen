---
name: powerhouse-connector-response-normalization
description: Mandatory resilience rules for GitHub and other connector responses whose identifiers or payload fields can vary across wrappers, versions, or transport layers.
---

# Powerhouse Connector Response Normalization

Fingerprint: `connector|response-shape|normalize-before-use|v1`.

## Problem class

Connector wrappers can return the same semantic value under different payload envelopes or field names. A write pipeline must never assume that a tree SHA, commit SHA, ref, id, URL, or status is present in one hard-coded field without validating the actual response.

The incident on 2026-09-25 occurred before any branch mutation because a bundled Git tree write expected the tree SHA in one field while the connector returned it in another response shape.

## Mandatory preflight

Before any mutating multi-step connector sequence:

1. Read or inspect the connector's current response contract when available.
2. Normalize the response into canonical internal keys before the next mutating call.
3. Validate required semantic identifiers before mutation.
4. If normalization fails, stop before side effects and switch to an already-authorized safer write path.
5. Never guess identifiers and never derive them from unrelated fields.

## Canonical normalization

For every response, extract semantic identifiers through a bounded ordered lookup over known envelopes rather than one direct field assumption.

At minimum support:
- direct `sha`;
- `result.sha`;
- direct `commit_sha`;
- `result.commit_sha`;
- direct `id` / `result.id`;
- direct `url` / `result.url`.

If the required semantic value is absent:
- classify as `CONNECTOR_RESPONSE_SHAPE_MISMATCH`;
- record the raw response shape without secrets;
- do not mutate branch/ref state;
- use a safer existing connector action such as per-file Contents API writes when it preserves the same delivery contract.

## Git tree write rule

Bundled Git tree writes are optional optimizations, not authority.

Before `create_tree -> create_commit -> update_ref`:
- prove the returned tree SHA is normalized and valid;
- prove the base commit and parent identities;
- prove the target branch/ref;
- fail before ref mutation if any identity is absent.

If the tree SHA cannot be normalized, fall back to serial branch-safe `create_file` / `update_file` actions. The fallback must preserve the same canonical branch and obligation lineage and must not open a duplicate PR.

## Recovery behavior

A connector response-shape mismatch is recoverable transport/schema drift, not a repository failure.

Required recovery:
- keep the same obligation;
- keep the same branch when it exists;
- do not repeat already-proven side effects;
- choose a bounded fallback route;
- verify each returned commit/ref identity before continuing;
- write learning, ledger and skill projection in the same lineage.

## Forbidden patterns

- hard-coding one connector envelope without validation;
- assuming `response.sha` or `response.result.sha` without normalization;
- continuing with undefined or guessed SHA/ref values;
- retrying the same incompatible write blindly;
- creating a parallel branch/PR solely because the connector shape changed;
- reporting success without readback of the written branch/commit.

## Terminal proof

This incident class is prevented only when:
- the normalization/fallback rule is discoverable by agents;
- a regression test enforces the contract;
- the learning and ledger entry are present;
- repository writes are read back;
- the delivery lineage reaches the normal protected merge and production/readback contract where applicable.
