# 2026-10-28 — Edge-functies: runtimefouten uit deno check

Obligation: edge-runtime-typefix-20261028.

Drie runtimefouten gefixt (uuid niet gedefinieerd in powerhouse-runtime; .catch op Postgrest-builder in twee functies). Regressietest: tests/brain-edge-runtime-typefix-20261028.test.mjs. Overige typefouten bewust buiten scope.
