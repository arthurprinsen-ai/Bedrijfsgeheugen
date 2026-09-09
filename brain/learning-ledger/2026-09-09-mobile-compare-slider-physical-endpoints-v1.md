# Mobile compare slider — fysieke eindpunten en canonical ownership

Datum: 2026-09-09
Type: RECOVERY / IMPROVEMENT / PRODUCTION_PROMOTION
Fingerprint: mobile-compare-slider-physical-endpoints-v1

## Probleem
Op mobiel kon de compare-slider functioneel wel waarden richting 0% en 100% bereiken, maar de zichtbare gele scheidingslijn en de leesbare teksttoestand waren niet volledig gekoppeld aan één canonical interaction owner. Daardoor kon de UI aanvoelen alsof de slider niet echt tot de uiterste linker- of rechterrand ging en bleef tekst visueel afgesneden.

## Root cause
De canonical runtime bezat pointer-events, snapping en de numerieke 0–100 positie, terwijl endpoint-readability en visuele eindpuntsemantiek deels via andere/fallback logica liepen. Daardoor waren numerieke sliderpositie en zichtbare fysieke endpoint-rendering niet één invariant.

## Oplossing
De canonical runtime `assets/compare-slider-runtime.js` is de enige owner gemaakt van de volledige endpoint-rendering:

- de runtime rendert zelf `.bg-compare-divider`;
- de divider gebruikt dezelfde canonical splitwaarde als de clip-paths en handle;
- bij 0% staat de divider flush tegen de fysieke linkerrand met `translateX(0)`;
- bij 100% staat de divider flush tegen de fysieke rechterrand met `translateX(-100%)`;
- tussenliggende posities gebruiken gecentreerde rendering met `translateX(-50%)`;
- pointercoördinaten worden begrensd tegen de volledige `getBoundingClientRect().width` van de slider;
- mobile readability state wordt vanuit dezelfde canonical runtime gesynchroniseerd;
- pointer capture/window tracking en keyboard-endpoints blijven behouden.

Runtimeversie na fix: `full-endpoints-v9-physical-edges`.

## Regressieborging
Test toegevoegd: `tests/site-shell-compare-slider-physical-edges.test.mjs`.

De test borgt minimaal:

- expliciete endpoint-state voor 0% en 100%;
- aanwezigheid van de canonical divider;
- flush transforms voor links en rechts;
- pointermove-windowtracking;
- clamp op de volledige fysieke kaartbreedte.

## Releasebewijs
PR: #1272 — `Fix compare slider to true physical edges`

Kandidaat-SHA: `0ed1bfc589ea23bb9f72dda6ad78ffa26c8a5550`

Required test op de kandidaat-SHA: groen.

Squash-merge naar main: `4b007f2eafea4c666dbe032bda389fb6e29e9d55`.

Netlify productie-deploy:

- site: `bedrijfsgeheugen`
- deploy id: `6aa117e05b770200086ad688`
- context: `production`
- state: `ready`
- commit_ref: `4b007f2eafea4c666dbe032bda389fb6e29e9d55`
- published_at: `2026-09-09T08:25:46.550Z`
- canonical URL: `https://www.bedrijfsgeheugen.nl`

## Preventieregel
Een compare-slider mag nooit meerdere onafhankelijke owners hebben voor numerieke positie, pointer-interactie, zichtbare divider, clipping en endpoint-readability. Eén canonical runtime moet al deze states uit dezelfde splitwaarde afleiden. Een test die alleen 0–100 numeriek controleert is onvoldoende: fysieke randpositie en zichtbare endpoint-state moeten expliciet worden getest.

## Hergebruikregel voor toekomstige agents
Bij een melding als “slider gaat niet echt helemaal naar links/rechts” niet eerst padding, tekstbreedte of CSS-offsets tunen. Controleer eerst:

1. wie interaction ownership heeft;
2. welke DOM-node de zichtbare divider rendert;
3. of divider, clip-path, handle en readability dezelfde canonical splitwaarde gebruiken;
4. of `clientX` tegen de volledige slider-rect wordt omgerekend;
5. of 0% en 100% als fysieke eindpunten afzonderlijk in regressietests zijn vastgelegd.

Alleen wanneer deze vijf punten kloppen mag verdere layout-tuning volgen.
