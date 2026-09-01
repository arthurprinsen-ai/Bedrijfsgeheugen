# Wat er misging op 31 augustus en 1 september 2026 — en waarom

Vastgelegd zodat dezelfde fouten niet nog een keer een dag kosten. Elke fout
staat met het **verschijnsel** (wat je zag), de **oorzaak** (wat het echt was) en
de **regel** die eruit volgt.

## De duurste: gemeten op de server, niet bij de bezoeker

**Verschijnsel.** Ik meldde uren achtereen dat iets live stond; Arthur zag het
niet. Beide waarnemingen klopten.

**Oorzaak.** In `_headers` stond een cacheregel voor `/*.html`. De echte adressen
heten `/product` en `/ai-act` — zonder `.html`. Die vielen buiten de regel en
kregen geen cache-instructie mee, waarna de Netlify-edge ze vasthield met
`ttl=31535996`: 365 dagen. Mijn curl raakte een edge-node met de nieuwe build,
zijn telefoon een node die de oude versie een jaar mocht bewaren.

**Regel.** Controleer bij "het staat er wel / ik zie het niet" éérst de
responsheaders (`cache-status`, `age`, `cache-control`), niet de HTML. En:
patronen in `_headers` matchen bestandsnamen, niet routes.

**Geborgd.** `/*` heeft nu `Cache-Control: max-age=0, must-revalidate` en
`Netlify-CDN-Cache-Control: max-age=30`. Onderaan elke pagina staat een
bouwstempel met datum en tijd, zodat in één oogopslag te zien is welke versie op
het scherm staat.

## Klassenamen die bestaande elementen kapen

**Verschijnsel.** Tekst uit een gewoon inhoudsblok hing gedraaid over het scherm.

**Oorzaak.** De speelse laag gebruikte de klasse `geeltje`. Die bestond al in de
inhoud. Mijn regel "zweef en tuimel" pakte dus zijn tekst. Ook `streep`, `lek`,
`lijn`, `bron`, `sub`, `net`, `vak`, `cijfer`, `meter` en `score` botsten.

**Regel.** Alles wat de bouwstap zelf toevoegt krijgt het voorvoegsel `bgx-`.

## Een hernoeming die maar half doorwerkte

**Verschijnsel.** De easter egg deed niets: typen op `geheugen` leverde geen
geeltjes op.

**Oorzaak.** De hernoeming naar `bgx-` paste de CSS aan en de HTML, maar niet de
regel `element.className = 'geeltje'` in JavaScript. Opmaak en element hadden
verschillende namen. Ik had na de hernoeming alleen gecontroleerd of de oude
klassen intact waren, niet of mijn eigen elementen hun nieuwe naam kregen.

**Regel.** Na een hernoeming ook zoeken op toekenningen in JavaScript
(`className`, `classList.add`, `setAttribute('class'…)`), niet alleen op
selectors.

## Verbergen zonder garantie dat het weer aangaat

**Verschijnsel.** Vijftien van de twintig onderdelen op een pagina bleven
onzichtbaar.

**Oorzaak.** De opkomanimatie zette elementen op `opacity: 0` en wachtte op een
melding dat ze in beeld kwamen. In een ingebedde weergave scrolt niet het
document maar een laag eromheen; die melding kwam nooit.

**Regel.** Verbergen mag alleen als het script het ook weer kan onthullen: pas
verbergen nádat het script draait, zelf meten bij elke scroll (ook van een
omhullende laag), en na anderhalve seconde alsnog alles tonen.

## De scope die nergens op sloeg

**Verschijnsel.** Iconen van 350 pixels, labels die aan elkaar plakten, een
pagina die uit elkaar viel.

**Oorzaak.** De oorspronkelijke opmaak werd gescoopt onder `.bg-inhoud`, terwijl
de container `.inhoud-body` heet. Geen enkele van de 36.000 tekens opmaak deed
iets. Dit kostte drie rondes om te vinden omdat ik naar de symptomen keek.

**Regel.** Als opvallend veel tegelijk misgaat, is er meestal één schakel kapot,
niet twintig. Controleer eerst of de opmaak überhaupt aankomt.

## Een tweede schil om dezelfde pagina

**Verschijnsel.** Verversen op een subpagina sprong terug naar de homepage.

**Oorzaak.** Elke bouwronde zette een nieuwe schil om een pagina die er al één
had: twee `<main>`-elementen en twee keer het id `view-inhoud`. De router kiest
op dat id en wist niet welke.

**Regel.** Een bouwstap die zijn eigen uitvoer kan tegenkomen moet idempotent
zijn: eerst kijken of het werk al gedaan is, dan de oorspronkelijke inhoud pakken
en de eigen toevoegingen verwijderen voordat je ze opnieuw plaatst.

## Blindelings committen zonder eerst te bouwen

**Verschijnsel.** Reparaties die live nieuwe problemen veroorzaakten: een
zoek-en-vervang die niet matchte en stil faalde, waarna de vraagbalk en de
rekenaar van alle menupagina's verdwenen.

**Oorzaak.** Ik patchte bestanden op de server via string-vervanging zonder de
site lokaal te bouwen en te bekijken.

**Regel.** Bouw lokaal, open het resultaat in een browser, meet, en commit dan
pas. Een vervanging die niets vindt hoort een fout te geven, geen stilte.

## Één bestand dat drie keer buiten de boot viel

**Verschijnsel.** `blog/index.html` hield de oude kop, kreeg geen foto-omzetting
en geen bouwstempel.

**Oorzaak.** Het matcht `*.html` niet (het staat in een map) en
`blog/*/index.html` evenmin (het staat één niveau te hoog). Drie keer opnieuw
gerepareerd op drie plekken.

**Regel.** Eén functie die alle pagina's teruggeeft, en die overal gebruiken.

## Wat de site zelf aan fouten bleek te hebben

Niet door mij veroorzaakt, wel gevonden en gerepareerd:

- **`assets/js/bronsync.js` stond base64-gecodeerd in de repo.** De browser kreeg
  een muur letters in plaats van JavaScript en gaf op elke pagina een
  syntaxfout. De Supabase-kerncijfers werden nergens opgehaald.
- **`assets/portal-v18-full.png` bestond niet**, terwijl de homepage en `/product`
  ernaar verwezen. Het portaalbeeld wordt nu in de pagina getekend.
- **72 van de 81 pagina's claimden hetzelfde zoekwoord** — "digitalisering mkb",
  dat in de eigen zoekwoordendatabase 50 zoekopdrachten per maand heeft en op
  *Afgevallen* staat. Ondertussen lag "ai act" met 3.600 per maand ongeclaimd.
- **Acht componentfragmenten en twee werkbestanden stonden als volwaardige
  pagina's in de sitemap.**
- **Een paginascript declareerde een naam die de schil ook gebruikt**
  ("Identifier 'pages' has already been declared"), waarna de rest van dat script
  stopte.
- **Zes sfeerfoto's kwamen via een hotlink van een fotosite.** Nu in de eigen
  repo, met lazy loading.

## De rode draad

Vier van de zeven eigen fouten hadden dezelfde vorm: **ik nam aan dat een
bewerking was gelukt zonder het resultaat te bekijken.** Een vervanging die niets
vindt, een klasse die half hernoemd wordt, een scope die nergens op slaat, een
cacheregel die niet matcht — allemaal onzichtbaar tot iemand ernaar kijkt.

De maatregel is niet "beter opletten" maar meten: bouw lokaal, open in een
browser, tel wat er staat, en controleer bij twijfel de headers in plaats van de
HTML.
