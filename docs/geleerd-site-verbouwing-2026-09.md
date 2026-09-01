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

## Toevoegingen van 1 september, middag

### Een geslaagde commit is geen geslaagde deploy

**Verschijnsel.** Ik meldde uren "commit ok" terwijl er niets veranderde op de site.

**Oorzaak.** Eén verkeerde import (`HERO_URL` uit het verkeerde bestand) liet de
bouwstap met een fout eindigen. Netlify doet dan wat hij hoort te doen: de vorige
versie blijft staan. Alles wat daarna gecommit werd, kwam nooit live.

**Regel.** De controle na een commit is niet "staat het in de repo" maar **"is
`/versie.txt` opgeschoven"**. En: bouw eerst lokaal vanuit een schone checkout —
niet in een map waar al eerder gebouwd is, want dan stapelen bewerkingen zich op
en zie je fouten die er in productie niet zijn (en andersom).

### Een eenpagina-app en losse pagina's vechten om dezelfde adressen

**Verschijnsel.** Elke pagina klopte als ik het adres rechtstreeks opvroeg, maar
wie via het menu klikte kreeg de oude weergave zonder hero, video of onderdelen.
Dat verschil hield dagenlang stand: ik testte URL's, de gebruiker klikte links.

**Oorzaak.** De v18-app hangt een klikafhandelaar aan élk element met
`data-view`, inclusief de gewone links in het menu, en roept `preventDefault()`
aan. De browser navigeert dus niet; de app toont een weergave binnen de pagina
waar je al bent. Die weergave zit in de payload van de homepage en heeft geen van
de toevoegingen die in het losse bestand staan.

**Regel.** Combineer je een eenpagina-app met echte pagina's onder dezelfde
adressen, regel dan expliciet wie wint. Hier: heeft het element een `href` naar
een ander pad, dan blijft de klik ongemoeid en navigeert de browser.
**En test navigatie zoals een bezoeker hem gebruikt — klikken, niet URL's opvragen.**

### Onderaan toevoegen is hetzelfde als niet toevoegen

Op een pagina van dertig meter stonden de nieuwe onderdelen op 28.000 pixels.
Ze waren er, en niemand zag ze. Blokken worden nu door de tekst verdeeld en op de
homepage direct onder de hero geplaatst.

### Het patroon achter al deze fouten

Zeven van de tien fouten van deze twee dagen hebben dezelfde vorm: **ik nam aan
dat een stap gelukt was, op grond van iets anders dan het eindresultaat.** Een
commit in plaats van een deploy. Een string in de HTML in plaats van wat een
browser toont. Een meting vanaf een server in plaats van vanaf het apparaat van
de gebruiker. Een opgevraagde URL in plaats van een geklikte link.

De vaste volgorde is daarom: **bouw schoon → open in een browser → meet wat een
bezoeker doet → controleer het versiestempel → pas dan melden dat het klaar is.**

## Toevoegingen van 1 september, avond

### "Commit geweigerd" heeft drie totaal verschillende oorzaken

**Verschijnsel.** Vier commits geweigerd met *409 Conflict — het bestand wordt
gewijzigd door een ander proces*. Ik concludeerde dat er iets anders tegelijk
schreef. Dat klopte niet.

**Oorzaak.** `main` is beschermd en vereist de statuscheck `test`. De
Contents-API vertaalt dat naar een misleidende 409. Pas via de Git-database-API
kwam de echte melding: *Required status check "test" is expected*.

**Regel.** Onderscheid **build faalt**, **schrijfconflict** en **beschermde
branch**. De Contents-API wijst de verkeerde kant op; ref → commit → tree →
update geeft de echte reden. In deze repo loopt alles via een pull request: tak,
PR, wachten tot `test` groen is, dan mergen.

### Een controle die naar de verkeerde string kijkt slaat zichzelf over

**Verschijnsel.** De gegevensbalk stond in de opmaak van elke pagina maar het
element verscheen nergens. Ik telde `bgx-gegevens`, kreeg 7 treffers — allemaal
CSS-regels — en concludeerde dat het werkte. Twee keer dezelfde meetfout, ook
lokaal.

**Oorzaak.** De guard luidde `if (html.includes('bgx-gegevens')) return html;`.
Die tekst stond al in de pagina als stijlblok, dus de stap sloeg zichzelf over.

**Regel.** Een controle op "is dit er al?" kijkt naar het **element**
(`<div class="bgx-gegevens">`), nooit naar een naam die ook in de opmaak staat.
En bij meten: tel elementen, niet strings.

### Definitieve werkvolgorde

1. Bouw lokaal vanuit een **schone checkout** — nooit in een map waar al gebouwd is
2. Open het resultaat in een browser, op telefoonformaat én desktop
3. Tel **elementen**, niet strings; klik wat een bezoeker klikt
4. Tak + pull request; wacht tot `test` groen is
5. Merge, wacht op de build
6. Controleer dat **`/versie.txt` is opgeschoven**
7. Pas dan melden dat het klaar is
