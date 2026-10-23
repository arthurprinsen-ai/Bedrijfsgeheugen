# Obligation Terminal Closure PR-body context v1

## Incident
Post-merge run `37647792955` for Security Trust recovery PR #4063 failed in the identity step with `OBLIGATION_ID_MISSING`.

The merged PR itself contained valid `Obligation-ID`, `Delivery-Lane`, candidate type and base SHA. The preceding workflow step also fetched the canonical merged PR and produced `body_b64`.

## Root cause
The identity step decoded `PR_BODY_B64`, but that variable was never mapped from `steps.context.outputs.body_b64` into its environment. The failure was therefore workflow context wiring, not missing delivery metadata.

## Fix
The identity step now explicitly binds the resolved PR-body output before decoding and parsing delivery metadata.

A regression test scopes itself to the identity block and requires:
- explicit PR-body environment binding;
- decode from `PR_BODY_B64`;
- metadata parsing from decoded `PR_BODY`.

## Structural rule
Post-merge and manually resumed terminalization resolve identity from the fetched canonical merged PR. Event payload presence is not treated as an implicit shell-environment contract.


## Canonicalization recovery

The first protected repair proved the workflow identity fix but Powerhouse Skill Projection correctly rejected its learning evaluation because the regression path was outside the canonical `tests/brain-*.test.mjs` namespace.

The recovery adds `tests/brain-obligation-terminal-closure-pr-body-context-v1.test.mjs` and points historical replay, shadow and canary evaluation to that canonical Brain regression. The workflow implementation itself is unchanged.
