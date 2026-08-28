# Prototype preview — lessons learned & regressieregels

Dit document borgt de fouten en herstelacties uit de V18-previewreeks. Het doel is dat toekomstige agents deze fouten niet opnieuw introduceren.

## Niet-onderhandelbare regels

1. Werk altijd verder op de laatst bewezen werkende HTTPS-preview. Geef de gebruiker nooit opnieuw een lokaal `sandbox:`-HTML-bestand als vervanging voor een werkende live preview.
2. Wijzig bij een visuele aanpassing alleen het bedoelde onderdeel. Voor een hero-video mag menu, routing, scans, portal, views, footer of SPA-navigatie niet worden herschreven.
3. Productie (`main` / www.bedrijfsgeheugen.nl) blijft onaangeraakt totdat de gebruiker expliciet toestemming geeft om te mergen.
4. De preview-PR blijft draft zolang de gebruiker alleen test.
5. Claim nooit dat Safari/iPhone live is getest als dat niet daadwerkelijk is gebeurd.

## Fouten die zijn opgetreden

### Verkeerde prototypebasis live gezet
De vereenvoudigde V18.6/7-build werd gepubliceerd terwijl de gebruiker de rijke V18.5-designlijn bedoelde.

**Regel:** visuele fixes altijd uitvoeren op de laatst door de gebruiker geaccepteerde volledige basis, niet op een vereenvoudigde reconstructie.

### Verkeerde hero-video
Eerst werd een andere Pexels-video gebruikt; daarna een wolkenclip en vervolgens een zakelijke teamvideo. Technisch werkend, inhoudelijk niet passend.

**Regel:** hero moet inspirationeel zijn zonder zakelijke hoofden, kantooroverleg of generieke wolken. Richting: abstract licht, flow, diepte, vooruitgang, premium blauw/warm accent.

### Safari/browser-decompressie
`DecompressionStream` en een fallback-decoder veroorzaakten fouten op iPhone/Safari.

**Regel:** browser mag nooit verantwoordelijk zijn voor gzip/chunk-reconstructie van het prototype. Reconstructie gebeurt server-side; browser ontvangt gewone HTML.

### Payload 100484 versus 108484
Een segment van precies 8000 tekens ontbrak. `chunk-gap.txt` bleek een noodzakelijk deel van de canonieke payload.

**Regel:** serverfunctie valideert altijd:
- base64-lengte exact 108484;
- payload SHA-256 exact `64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b`;
- HTML SHA-256 exact `be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b`.

### Corrupte/verkeerde chunk-03
`chunk-03` week af van de canonieke payload. De juiste reconstructie gebruikt de gecontroleerde subdelen.

**Regel:** gebruik de huidige `FILES`-volgorde in `netlify/functions/prototype-v18.mjs`; niet improviseren met oude samengestelde chunk-bestanden.

### Dubbele video-controller
Meerdere playback-controllers konden elkaar tegenwerken waardoor opacity/playback fout ging.

**Regel:** exact één controller mag `heroBackgroundVideo` aansturen. iOS-attributen: `autoplay muted playsinline loop` plus `defaultMuted=true` en play-retry op load/visibility/first interaction.

### Menu/interactie werkte niet in lokaal bestand
De gebruiker kreeg een lokaal prototype waarin de route- en assetsituatie afweek van de live site.

**Regel:** acceptatie gebeurt op de Netlify Deploy Preview via HTTPS. Geen lokale file-URL als eindacceptatie.

## Verplichte regressiechecks vóór een link wordt gedeeld

- Netlify status is `success`/`ready` voor exact de laatste branchcommit.
- PR-head SHA en Netlify commit-ref komen overeen.
- 14 `view-*` views zijn aanwezig.
- `v18MobileDrawer` bestaat.
- interne `data-view` routing is aanwezig.
- exact één `heroBackgroundVideo`.
- video heeft `autoplay`, `muted`, `playsinline`, `loop`.
- geen oude Pexels people/cloud URL in de live response.
- hero gebruikt een same-origin asset onder `/assets/`.
- JS-syntax check is groen.
- productie is niet gewijzigd.

## Wijzigingsstrategie

Voor visuele hero-wijzigingen wordt de canonieke HTML niet opnieuw opgebouwd. De bestaande serverfunctie valideert eerst de canonieke payload en vervangt daarna uitsluitend de `<video id="heroBackgroundVideo">`-tag. Dit beperkt het blast radius en beschermt menu, routing en portal.

## Actuele hero-richting

- Geen mensen/hoofden.
- Geen kantoorbeelden.
- Geen generieke wolken.
- Abstracte motion: blauw/navy, subtiele warme highlights, lichtstromen/netwerklijnen, diepte en rustige vooruitgang.
- Achtergrond moet hero-copy leesbaar houden.
- Same-origin MP4 + SVG-poster voor maximale voorspelbaarheid.
