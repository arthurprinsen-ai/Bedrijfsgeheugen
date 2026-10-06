# Required context uniqueness and terminalizer governance closure

## Escaped defects

PR #3908 exposed two independent control-plane problems.

First, GitHub main protection correctly required `test` and `CodeQL javascript-typescript`, but more than one workflow could publish the generic `test` context. A fast green context could therefore satisfy branch protection before `Required test -> test` finished.

Second, post-merge terminalization treated Supabase Edge authority registry/contract/governance files as unknown runtime and failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`.

## Structural repair

- The protected `test` context now has one workflow owner only; the uniqueness regression is already on main.
- The Required-test wiring regression already includes the Supabase preview dependency.
- The terminalizer explicitly classifies the Supabase Edge authority contract, runtime-authority governance evaluator and runtime-authority registry as governance-only.
- Unknown runtime paths still fail closed.
- Main Protection Observation now reports the live protected contexts: `test` and `CodeQL javascript-typescript`, not retired workflow names.

## Closure

After this repair merges, PR #3908 can be replayed under the current terminalizer. No provider deployment or social publication is required for that replay.
