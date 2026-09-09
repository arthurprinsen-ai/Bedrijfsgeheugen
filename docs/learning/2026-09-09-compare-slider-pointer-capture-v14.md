# Compare slider: pointer-capture v14

## Besluit
Voor alle compare-sliders op Bedrijfsgeheugen is Pointer Events de primaire interactietransportlaag. Native `input[type="range"]` mag niet meer de fysieke mobiele drag bepalen.

## Waarom
Op echte iPhone/Safari bleek meerdere keren dat een numerieke `0` of `100` op een native range niet hetzelfde bewijs is als een zichtbare slider die daadwerkelijk de fysieke kaartrand bereikt. Range-thumb geometrie en WebKit-insets maakten eerdere fixes met clamps en pixelcompensaties fragiel.

## Canonieke implementatie
1. `pointerdown` op de slider neemt de pointer over met `setPointerCapture(pointerId)`.
2. Tijdens `pointermove` wordt uitsluitend de echte kaartgeometrie gebruikt:
   `x = clamp(event.clientX - rect.left, 0, rect.width)`.
3. `value = x / rect.width * 100` is de enige numerieke bron.
4. Diezelfde waarde stuurt `--bg-compare-split`, `--split`, beide `clip-path`s, divider, handle, `aria-valuenow` en endpoint-marker.
5. `pointerup`/`pointercancel` geven pointer capture veilig vrij.
6. `touch-action: pan-y` houdt verticale paginascroll intact.
7. Een bestaande native range wordt bij actieve v14-laag passief gemaakt (`pointer-events:none`, `tabindex=-1`) en is alleen fallback.

## Releasecontract
Een release is niet bewezen door `range.value = 0/100`. De browsergate moet via echte pointerdrag vanaf de slider naar buiten beide kaartgrenzen gaan en aantonen dat:

- links: `split <= 0.01`, endpoint `start`, ARIA `0`, divider op `slider.left`;
- rechts: `split >= 99.99`, endpoint `end`, ARIA `100`, divider op `slider.right`;
- dit werkt op telefoon, tablet, desktop en beide oriëntaties;
- er geen horizontale overflow of regressie in de wijzigingsflow ontstaat.

## Niet opnieuw doen
- Geen 24px/28px of andere magic edge-offsets.
- Geen `left: clamp(...)` voor de revealpositie.
- Geen tweede runtime die dezelfde sliderstate bezit.
- Geen mobiele fix uitsluitend beoordelen met viewport-emulatie en programmatic range-values.
- Geen productieclaim zonder exacte GitHub-main + Netlify `commit_ref` readback.

## Bronnen
- MDN `setPointerCapture`: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- MDN Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- WebKit range-thumb clipping bug: https://bugs.webkit.org/show_bug.cgi?id=146896
