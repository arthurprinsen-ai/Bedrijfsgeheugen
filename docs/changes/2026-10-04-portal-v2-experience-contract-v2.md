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
