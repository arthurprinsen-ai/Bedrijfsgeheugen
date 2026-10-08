# Structural repair — backend non-runtime terminal closure
**Obligation:** terminal-nonruntime-backend-readback-20261008-v1

## Live incident and root cause
On 8 October PR #4174 (CI lane routing) passed Required, both CodeQL jobs and protected merge; its obligation terminal closure run [#37795000123](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37795000123) failed `PRODUCTION_DESCENDANT_READBACK_NOT_PROVEN`. The work changed only internal delivery classifier, tests and Brain learning/docs. The terminal workflow required Netlify production evidence despite no Netlify-hosted artifact change because its existing GitHub-main non-runtime proof branch allowed only `DELIVERY_LANE=automation`, not backend.

In parallel, `tools/delivery/terminal-release-scope.mjs` did not consult the canonical `productionTruth.verifierOnlyPrefixes` containing `scripts/brain/`; these verifiers were incorrectly counted as unknown runtime changes.

## Minimal existing-authority correction
1. Use `brain/contracts/production-readback-v1.json` to classify canonical verifier-only prefixes and exact paths, retaining the existing fail-closed runtime classifier.
2. Select current protected `main` ancestor evidence for **any** delivery lane when every changed path is non-runtime. This still requires a proven merge SHA contained in the observed `main`.
3. Keep the original Supabase provider readback, Netlify exact release checks, Brain terminal learning and projection intact for their actual scopes.

## Tests and evidence
Regression in `tests/brain-terminal-release-authority-scoped-v1.test.mjs` replays #4174 and the CI intelligence collector paths, confirms protected main-only readback for backend and preserves fail-closed unknown/website/Edge behavior. Protected Required + CodeQL must pass. Historical #4174 remains a failed record until a canonical replay/reconciliation independently verifies and closes it; do not overwrite or pretend it succeeded.
