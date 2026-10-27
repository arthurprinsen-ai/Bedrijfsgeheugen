# Portal V2 navigation / Netlify recovery — 2026-10-01

Obligation: `portal-v2-navigation-polish-20261001`

The Portal V2 candidate had drifted behind current `main`, while Netlify production/build contracts had moved forward. The stale preview failed. The candidate was synchronized with current main without creating a second PR, the PR delivery metadata was rebound to the authoritative base, and the exact-head Netlify preview was rebuilt.

Evidence: preview deploy `6abe4b27e2105d00089a241d` for head `dbd8eb01ee19e44031234bfe639f99133377a6eb` reached `ready`. Portal V2 tests were green on the synchronized lineage. Same-lineage learning and change documentation were added because material delivery must not close without writeback.

Prevention: one obligation keeps one candidate head; synchronize that head with current main before promotion and require exact-head preview/readback rather than creating a replacement PR.
