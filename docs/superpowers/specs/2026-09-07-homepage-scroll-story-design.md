# Homepage scroll story design

## Doel
De sectie “Eén wijziging. Overal doorgewerkt.” moet niet aanvoelen als vier losse tekstblokken, maar als één zichtbare kettingreactie.

## Gedrag
- Desktop: één sticky story-stage met vier vaste states: Signaal, Context, Opvolging, Effect/Readback.
- Scroll en klik gebruiken exact dezelfde state-setter.
- De CTA “Analyseer impact” activeert Context en navigeert naar de bijbehorende scroll-state.
- Voltooide stappen blijven leesbaar, toekomstige stappen worden alleen gedimd.
- De cockpit verandert werkelijk per state door overlays voor context, acties en readback.
- De zwevende zoektijd/rekenkaart wordt tijdens de sticky desktop-story verborgen zodat stap 04 niet wordt bedekt.
- Mobiel: geen sticky constructie; de actieve state blijft in-flow zichtbaar.
- `prefers-reduced-motion` schakelt animaties en smooth scrolling uit.

## Bouwcontract
De fix wordt als laatste homepage-interactie in `tools/prijzen-uit-de-homepage.mjs` toegepast, zodat V18/page-policy stappen de wiring niet opnieuw verwijderen.

## Toegankelijkheid
- actieve stap krijgt `aria-current="step"`;
- stappen zijn toetsenbordbedienbaar via Enter/Space;
- overlays gebruiken `aria-live="polite"`;
- mobiele en reduced-motion fallbacks blijven functioneel zonder animatie.

## Regressie
Tests bewaken final-pipeline membership, click-to-scroll, state hooks, desktop/mobile split, overlap guard en toegankelijkheidsmarkers.
