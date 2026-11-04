# Ontwikkellog — Portal V2 mobile dialog focus/route, 2026-11-04

- Canonical owner: oorspronkelijke Portal V2 UX/Engineering; parent GitHub #4547; geen tweede writer, portaal, scheduler of incidentenregister.
- Incidentfingerprint: `portal|mobile-ux|dialog-loses-route-and-focus|20261104-v1`.
- Source: `portal-v2/app.js`, bestaand `role=dialog aria-modal=true` in `portal-v2/index.html`. Vorige expliciete menuafsluiters routeerden onvoorwaardelijk naar `overzicht` en misten focus-trap/restoration en inert-modality.
- Remedy: bestaande router als enige authority, eerder bezochte niet-hub-route in geheugen, focus initiator, afsluiter, inert en aria-expanded, Tab/Shift+Tab-cyclus.
- Regression: `tests/integration/portal-v2-mobile-shell.spec.js`; echte 390px browserbewijs nog nodig na gepubliceerde exacte SHA.
- Quality acceptance: Required/CodeQL/BRAIN/System Map, protected merge, Netlify exact-SHA, oorspronkelijke volledige browser suite en authentieke gebruikersobservatie. **Niet live bewezen** voor voltooid releasebewijs.
- Non-goals: verzonnen klantstatistieken, externe klantacties, OAuth/role bypass, nieuwe scheduling/handlers buiten bestaande navigatie.
