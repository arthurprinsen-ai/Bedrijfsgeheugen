# AI Modelwijzer — production build closure (30 september 2026)

## Existing state first
The canonical public Modelwijzer already exists on `main` with 103 model records across 10 providers and is registered in the Powerhouse System Map. This change does not replace that richer implementation.

## Root cause
Production was still serving an older Netlify commit. The new Modelwijzer had three integration gaps:
1. it was not marked as an interactive `EIGEN_WERKING` page in the V18 builder;
2. its Dutch copy had no deterministic English static-build cache while production is fail-closed on missing cache entries;
3. its canonical regression test was committed but not wired into CI.

## Fix
- preserve the existing interactive Modelwijzer through the canonical V18 build;
- add full NL→EN cache coverage for the Modelwijzer page;
- execute the advisor and production-build regressions in the canonical website lane;
- keep the existing 103-model catalog, governance policy, lead capture and Powerhouse node as authority.

## Terminal condition
Only claim live after protected merge to current main, Netlify `ready` on that main lineage, and public `/ai-modelwijzer` plus model catalog readback.
