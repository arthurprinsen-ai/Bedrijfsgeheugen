## 2026-11-17 — DESIGN — Rituals-beleving interactie (kandidaat)
- **Wijziging:** `assets/rituals-beleving.js`, generator-injectie, portaal-link, `\n`-fix.
- **Lokaal bewijs:** gedragstest desktop en mobiel, 24 tests groen.
- **Niet bewezen:** ingelogde weergaven, gedragseffect.
- **Status:** `CANDIDATE`.

## Onafhankelijke browserregressie en gerichte codefix
- Faalbewijs: Required browser run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44168414229 — 12/12 keer kopkleur rgb(20,23,26) waar RGB zwart vereist; geen tijdelijke browserfluctuatie.
- Werkelijke oorzaak: vorige CSS-selector was beperkt tot header.v17-header terwijl V18 dynamische meer-menu-root eventueel buiten de header wordt gemarkeerd.
- Herstel in dezelfde ontwerp-PR: assets/rituals-belevenis.css gebruikt enkel data-bg-megamenu-root="true" met afzonderlijk data-bg-megamenu-heading/link; geen route, inhoud of promo-kaartkleur gewijzigd.
- Test: bestaande echte tools/site-shell/v18-megamenu-browser-check.mjs, Required + CodeQL op nieuwe HEAD, geen uitzondering.
- Opleverstatus: bronkandidaat tot beschermd gemerged, exacte Netlify/productie en publieke mobile/desktop-readback; conversie-effect blijft onbekend.
