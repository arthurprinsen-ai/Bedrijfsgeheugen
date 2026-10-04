# Portal V2 Experience Contract v2 — 4 oktober 2026

Portal V2 heeft één gedeelde experience-authority: `portal-v2/experience.css` en `portal-v2/experience.js`.

De v2-contractlaag consolideert de eerder parallel ontwikkelde product-experience ideeën in dezelfde bestaande authority. Er komt dus geen tweede CSS/JS-stack.

Structurele borging:
- 6 kritieke routes × 4 viewports = 24 screenshots per visual-assurance run;
- desktop 1440, tablet 1024, mobiel 390 en narrow-mobile 320;
- horizontale overflow maximaal 2 px;
- gemarkeerde visual overflow faalt de assurance;
- kritieke controls minimaal 44 px;
- dynamische views worden via MutationObserver opgenomen;
- visualisaties worden via ResizeObserver opnieuw gemeten;
- runtime errors, rejected promises, route-interacties en visual overflow leveren `bg:portal-experience-signal`;
- Portal State/backend authority blijft ongewijzigd en fail-closed.

De overlappende PR #3682 wordt door deze lijn vervangen; de bruikbare regels daarvan zijn in deze ene contractlijn geconsolideerd.


## Terminale productieproof
- Status: LIVE_BEWEZEN / LIVE_PROVEN_RUNTIME
- Delivery PR: #3692
- Protected main: 392ec658131c01824712d83c83e41d36a3633575
- Netlify production deploy: 6ac25d5a4e893200088ae19b — ready
- Productie: https://www.bedrijfsgeheugen.nl/portal-v2/
- Required Test: 37207574172 — success
- Portal V2 DOM readback: 37207574039 — success
- Portal Visual Density: 37207574040 — success
- CodeQL: 37207574054 — success
- Skill Projection: 37208029113 — success
- Terminal closure: 37208029345 — success

Daarmee is de v2 assurance niet langer een candidate. De productie-readback en de machine-governance wijzen naar dezelfde terminale waarheid.
