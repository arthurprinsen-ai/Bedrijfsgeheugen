# Ontwikkellog — Portal V2 mobile dialog focus/route, 2026-11-04

- Canonical owner: oorspronkelijke Portal V2 UX/Engineering; parent GitHub #4547; geen tweede writer, portaal, scheduler of incidentenregister.
- Incidentfingerprint: `portal|mobile-ux|dialog-loses-route-and-focus|20261104-v1`.
- Source: `portal-v2/app.js`, bestaand `role=dialog aria-modal=true` in `portal-v2/index.html`. Vorige expliciete menuafsluiters routeerden onvoorwaardelijk naar `overzicht` en misten focus-trap/restoration en inert-modality.
- Remedy: bestaande router als enige authority, eerder bezochte niet-hub-route in geheugen, focus initiator, afsluiter, inert en aria-expanded, Tab/Shift+Tab-cyclus.
- Regression: `tests/integration/portal-v2-mobile-shell.spec.js`; echte 390px browserbewijs nog nodig na gepubliceerde exacte SHA.
- Quality acceptance: Required/CodeQL/BRAIN/System Map, protected merge, Netlify exact-SHA, oorspronkelijke volledige browser suite en authentieke gebruikersobservatie. **Niet live bewezen** voor voltooid releasebewijs.
- Non-goals: verzonnen klantstatistieken, externe klantacties, OAuth/role bypass, nieuwe scheduling/handlers buiten bestaande navigatie.


## Incident occurrence: actual production 390px browser #41861441439
- Protection/merge: original PR #5422 merged `176315de3738a1f59479fb137eae932531d27ae6`; immutable Netlify `6aeb53a0a8ed72ff08c447fd` READY exact SHA.
- Original browser failed an *added* return-route step because test called a distinct unpinned ES module `router.js` instead of the original query-pinned app instance, so the full-menu handler was never invoked. This is not a reason to disable test or reclassify failure as passing.
- Related UX risk: specialist `#portalView` is a separate overlay and needs to be closed upon opening the real full menu; original `closePortalPage()` is reused before menu focus/inert.
- Same original owner and fingerprint `portal|mobile-ux|dialog-loses-route-and-focus|20261104-v1`, now second production observation. Real new source, single integration PR, original mobile test + BRAIN regression, unchanged security gates and release proof.
- State: original #5422 published but **independent production mobile readback NOT GREEN**; new repair must be deployed and independently reproved.
