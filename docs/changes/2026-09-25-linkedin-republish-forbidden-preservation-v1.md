# LinkedIn republish-forbidden preservation v1

Date: 25 September 2026
Fingerprint: linkedin-republish-forbidden-preservation-v1

## Problem

A blocked publication claim can still represent a successful or possibly successful provider side effect. In that state, absence of verified readback is not evidence that no external post exists.

The content orchestrator previously preserved content-ready/scheduled/published-style states and verified provider references, but did not explicitly preserve blocked rows whose evidence said republishing was forbidden.

## Fix

Decision reconciliation now preserves an existing row when any of these are true:

- `delivery_evidence.republish_forbidden === true`;
- `delivery_evidence.possible_provider_side_effect === true`;
- `provider_create_success === true` and an exact `delivery_ref` is present;
- existing terminal/covered-state or verified-provider-reference rules already apply.

This means a later scheduler cycle cannot turn an ambiguous provider-side-effect claim back into a fresh `decided` publication.

## 25 September containment

The existing personal LinkedIn claim for 25 September is marked `blocked`, `republish_forbidden=true`, and `possible_provider_side_effect=true`. Its publication obligation carries the same containment evidence. No replacement post is authorized.
