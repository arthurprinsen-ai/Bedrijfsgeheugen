# Eén site: v18-opmaak, navigatie en interactie op elke pagina

**Vastgelegd op 31 augustus 2026. Vervangt het besluit van 13 augustus dat de
site-chrome in `assets/kop.css` vastlag en niet meer mocht wijzigen.**

## Waarom dit er is

Op 31 augustus stonden er feitelijk twee websites onder één domein. De homepage
en een handvol pagina's kwamen uit de v18-build (klein woordmerk, menu
Oplossingen · Platform · Prijzen · Kennis · Over ons · Meer, donkere stijl, geen
kruimelpad). Alle andere pagina's — blogs, koppelingen, kennis, scans — droegen
de oudere kop uit `assets/kop.css` met een ander menu, andere kleuren en een
kruimelpad. Wie op de homepage in het menu klikte, landde in een andere site.

Daar kwam bij: prijzen die elkaar tegenspraken, deelkaarten die allemaal naar de
homepage wezen, acht pagina's die niet in de sitemap stonden, en een
paginacontrole die dit alles niet zag omdat hij de repobestanden las in plaats
van wat de build oplevert.

## Wat er nu geldt

**De navigatie van de homepage is leidend.** Elke weergave uit de eenpagina-app
is een echte pagina met een eigen adres: `/product`, `/oplossingen`,
`/systemen-koppelen`, `/prijzen`, `/over-ons`, `/cases`, `/zelfscan`,
`/frisse-blik`, `/meer`, `/start`, `/inloggen`, `/aanmelden`. Waar een oude
pagina hetzelfde adres had, is die vervangen — nooit naast elkaar gezet.

**Elke andere pagina krijgt dezelfde schil.** Kop, navigatie, voet, blauwe hero
(`linear-gradient(135deg,#071a3c,#12316c)`), kruimelpad, tokens, letters en
kaarten komen uit de gebouwde homepage. De inhoud van de pagina zelf gaat daar
ongewijzigd in.

**De oorspronkelijke paginaopmaak gaat mee voor de structuur, niet voor de
kleur.** `assets/stijl.css` en de eigen `<style>`-blokken worden gescoopt onder
`.inhoud-body` en daarna ontdaan van alles wat op paginaniveau achtergrond,
kleur, lettertype of hoogte zet. Zonder die opmaak vallen kolommen, labels en
icoongroottes weg; met die opmaak in volle glorie wint de oude huisstijl van
v18. Dit is de balans.

## Hoe het gebouwd wordt

Alles gebeurt tijdens de build, niet in de repo. De bronbestanden blijven
leesbaar; de schil komt er in de build omheen. Terugdraaien is één stap uit
`netlify.toml` halen.

```
bouw-powerhouse-auth → bouw-kennisindex → bouw-v18-production
  → apply-tabbladen → bouw-v18-views → bouw-v18-chrome-alles → bouw-release-evidence
```

| Bestand | Doet |
|---|---|
| `tools/v18-views-lijst.mjs` | de weergaven uit het menu met hun adres, titel, omschrijving en zoekwoord |
| `tools/bouw-v18-views.mjs` | schrijft elke weergave weg als eigen pagina |
| `tools/bouw-v18-chrome.mjs` | zet de schil om de inhoud van een bestaande pagina |
| `tools/bouw-v18-chrome-alles.mjs` | doet dat voor alle overige pagina's en werkt de sitemap bij |
| `tools/v18-verrijking.mjs` | beweging, kruimelpad, mensenblok, vervolgstappen, schema's |
| `tools/v18-modules.mjs` | de interactieve onderdelen en de speelse laag |

De sitemap draait als laatste stap, want pas dan bestaan alle pagina's.

## Nieuwe pagina's

Een nieuwe pagina hoeft niets te weten van dit alles. Zet er een `<main>` in met
een `<h1>`, een intro en de inhoud, en de build doet de rest: schil, hero,
kruimelpad, interactie, schema's, sitemap. Hoort de pagina in het menu, dan komt
er een regel bij in `v18-views-lijst.mjs`.

Pagina's met eigen werking staan in `EIGEN_WERKING` (`tools/bouw-v18-chrome.mjs`).
Daar blijft de eigen opmaak volledig staan, omdat die het tonen en verbergen van
stappen stuurt. Zonder die uitzondering laat een scan al zijn vragen tegelijk zien.

## Interactie

Wat er gebeurt volgt uit wat er op de pagina staat:

- bedragen en percentages tellen op zodra ze in beeld komen
- de eerste lijst met korte punten wordt aanvinkbaar, met een uitkomst en een stap naar de zelfscan
- genummerde stappen worden een tijdlijn die meegroeit met het scrollen
- tabellen zijn sorteerbaar, met een balkje achter elk bedrag, in een schuifbare houder
- een prijsbereik wordt een schuif; staat er geen bereik, dan komt de ROI-rekenaar
- vragen op een vraagteken klappen uit
- "Vraag het deze pagina" zoekt het antwoord op en markeert het
- pagina's over overtypen krijgen de overtyptest
- "Laat Peter vertrekken" laat twee op de vijf regels vervagen
- het geeltje linksonder telt de weglekkende zoektijd
- wie `geheugen` typt, krijgt geeltjes

## Regels die niet gebroken mogen worden

1. **Eigen klassen krijgen het voorvoegsel `bgx-`.** Op 31 augustus kaapte een
   klasse `geeltje` uit de speelse laag een bestaand element in de inhoud, dat
   daardoor gedraaid over het scherm zweefde. Botsende namen waren er ook voor
   `streep`, `lek`, `lijn`, `bron`, `sub`, `net`, `vak`, `cijfer`, `meter`, `score`.
2. **Verbergen mag alleen als het script het ook weer kan onthullen.** De
   opkomanimatie zet pas iets op onzichtbaar nadat het script draait, meet zelf
   bij elke scroll (ook van een omhullende laag) en onthult na anderhalve seconde
   alsnog alles. Inhoud die niemand ziet is erger dan inhoud zonder beweging.
3. **Geen tekst in JavaScript.** Alles wat een bezoeker kan lezen, staat in de
   HTML. Interactie komt eroverheen.
4. **De scope heet `.inhoud-body`.** Wordt die naam gewijzigd, dan moet
   `scoopCss` mee. Op 31 augustus stond daar nog `.bg-inhoud` en deed de hele
   oude opmaak niets — dat kostte drie rondes om te vinden.

## Vindbaarheid

Elke pagina heeft eigen `title`, `description`, `canonical` en deelkaarten die
naar zichzelf wijzen (die stonden eerder allemaal op de homepage). Verder:
BreadcrumbList, WebPage of BlogPosting met Arthur als auteur, Organization
sitebreed, en FAQPage waar de pagina eigen vragen heeft.

De norm voor kop en voet komt uit `over-ons.html` na de build en wordt
weggeschreven naar `.github/canoniek/`. De homepage is uitgezonderd van die
vergelijking: daar staan knoppen in plaats van links, omdat de eenpagina-app
daarmee tussen weergaven schakelt.

## Wat nog open staat

- `/blog/systemen-koppelen-mkb/` en `/systemen-koppelen` claimen allebei
  "systemen koppelen mkb" — één moet een ander zoekwoord
- `/blog/werkinstructie-voorbeeld/` noemt zijn zoekwoord niet in titel of h1
- help, changelog, juridisch, onderzoeken en partners krijgen alleen menu-links
- `assets/portal-v18-full.png` bestaat niet; het portaalbeeld wordt nu in de
  pagina getekend in plaats van als afbeelding geladen
- 281 foto's worden vanaf pexels.com geladen in plaats van uit de eigen repo
