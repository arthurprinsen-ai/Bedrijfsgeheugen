# Compare slider native range — duurzame learning

Datum: 2026-09-08

## Aanleiding

Echte iPhone/Safari-drag op de site-wide compare sliders bereikte niet betrouwbaar de volledige fysieke eindstanden 0% en 100%. Daardoor kon aan de uiterste randen nog een deel van de verkeerde zijde zichtbaar of onleesbaar blijven.

## Root cause

De custom gesture-/pointerlaag was niet voldoende robuust als primaire mobiele bediening. Daarnaast controleerde de broad-browser regressietest na de fix nog focusbaarheid op de oude visuele `.compare-knob`, terwijl die knop niet langer de canonieke user-input was.

## Besluit / invariant

`.bg-compare-range` — een native, volledige-breedte `input[type="range"]` met min=0, max=100 en step=1 — is voortaan de canonieke bediening voor alle compare sliders. De visuele knob/handle is presentatie en mag niet als vervangende actieve control worden getest.

Alle compare sliders moeten op mobiel én desktop exact de volledige 0–100 reveal kunnen bereiken:

- helemaal links: split=0, range.value=0, scheidingslijn fysiek links en alleen de witte/rechter `after`-laag volledig zichtbaar;
- helemaal rechts: split=100, range.value=100, scheidingslijn fysiek rechts en alleen de blauwe/linker `before`-laag volledig zichtbaar;
- tussenliggende waarden tonen de overgang zonder mobiele stacked fallback.

## Verplichte regressie-eisen

Toekomstige sliderwijzigingen mogen pas worden gemerged wanneer de browsercontracten de echte actieve control testen en bevestigen dat:

1. `.bg-compare-range` aanwezig, actief en focusbaar is met bereik exact 0–100;
2. `range.value` beide eindstanden 0 en 100 bereikt;
3. de controlled split beide eindstanden 0 en 100 bereikt;
4. de fysieke scheidingslijn beide randen bereikt;
5. desktop 1128 px en mobiel 320, 390 en 430 px groen zijn;
6. broad-browser, targeted-browser, full-regression, page/SEO, public-visibility en de finale required `test` groen zijn.

Tests mogen niet opnieuw de retired `.compare-knob` als primaire interactiecontrol behandelen.

## Execution evidence

- PR: #1173 — `Fix iOS compare sliders with native full-range control`
- Merge/main SHA: `64501db9fcc17fe80759a20bc2884cc6f3629f2f`
- Required test run: `34222255858`
- Broad-browser job: `102048715900`
- Browser evidence: desktop 1128 px en mobiel 320/390/430 px bereikten `left=0`, `right=100`, `leftRange=0`, `rightRange=100`, met de fysieke handle op beide randen.
- Netlify production deploy: `6a9ff697fd42930008172a65`
- Netlify production `commit_ref`: `64501db9fcc17fe80759a20bc2884cc6f3629f2f`
- Productie: https://www.bedrijfsgeheugen.nl

## Preventieregel

Bij een toekomstige slider-regressie: test en repareer eerst de canonieke native range-control en de fysieke 0/100 readback. Verlaag of omzeil de endpoint-eisen niet om CI groen te krijgen. Een wijziging is pas klaar na merge, exacte production-SHA readback en live endpoint-verificatie.