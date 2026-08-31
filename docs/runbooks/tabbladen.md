# Tabbladen — favicon en titel per pagina

## Wat het probleem was (31 augustus 2026)

De homepage toonde in het browsertabblad een grijze wereldbol en altijd dezelfde
titel, hoe diep je ook in de site zat.

Twee losse oorzaken:

1. **Geen faviconverwijzing op de homepage.** `favicon.png` en
   `apple-touch-icon.png` staan al lang in de repo en 50 van de 54
   hoofdpagina's linkten er ook naar. De homepage niet: die wordt bij elke
   Netlify-build opnieuw uitgeschreven door `tools/bouw-v18-production-core.mjs`
   vanuit de vastgezette v18-payload, en de kop die
   `tools/apply-v18-seo.mjs` daarna aanbrengt bevatte titel, description,
   canonical, og en schema — maar geen icoon.
2. **De homepage is één pagina.** Oplossingen, Platform, Prijzen, Kennis, Over
   ons, Inloggen en Aanmelden zijn panelen (`#view-<naam>` met klasse `page`),
   geschakeld door `showView()`. De URL verandert niet, dus veranderde de
   tabtitel ook nooit. Hetzelfde geldt voor het klantportaal, dat met
   `#p-<naam>` en klasse `aan` werkt.

## Hoe het nu geregeld is

`tools/apply-tabbladen.mjs` draait in de Netlify-build, direct **ná**
`bouw-v18-production.mjs` en vóór `bouw-release-evidence.mjs` — in `[build]` en
in `[context.deploy-preview]`, die identiek moeten blijven.

De stap doet twee dingen over alle gepubliceerde HTML-pagina's:

- **Favicon.** Ontbreekt `rel="icon"` of `rel="apple-touch-icon"` in de kop, dan
  worden beide regels direct onder `</title>` gezet. Staat het er al goed, dan
  blijft de pagina onaangeraakt — de stap is idempotent.
- **Meebewegende titel.** Voor pagina's met panelen komt er één script
  `bg-tabtitel` in de kop. Dat kijkt welk paneel open staat, leidt de sleutel af
  uit het id (`view-pricing` → `pricing`) en zet de titel. Volgorde: een titel
  uit `site/tabtitels.json`, anders de tekst van de bijbehorende menuknop plus
  het achtervoegsel, anders de basistitel van de pagina.

## Waar je iets aanpast

| Wat | Waar |
| --- | --- |
| Titel per paneel | `site/tabtitels.json` → `panelen[].titels` |
| Nieuwe paneelpagina | regel toevoegen in `site/tabtitels.json` |
| Faviconbestand | `favicon.png` / `apple-touch-icon.png` in de repowortel |
| Pagina bewust overslaan | `overslaan` in `site/tabtitels.json` |

Fragmenten zonder `<title>` (`assets/blok-kop.html`, `assets/blok-voet.html`)
worden automatisch overgeslagen.

Niet in `index.html` knippen: die wordt elke build overschreven.

## Contract

`tests/tabbladen.test.mjs` bewaakt dat de stap in beide buildblokken staat en ná
de v18-bouw draait, dat elke gepubliceerde pagina met een titel een favicon
krijgt, dat een pagina die het al goed heeft onaangeraakt blijft, en dat opnieuw
draaien niet tot een tweede script of tweede titel leidt.

## Bekend en niet door deze wijziging veroorzaakt

`tests/integration/netlify-preview-contract.test.mjs` staat al rood op `main`:
die test eist dat de buildopdracht eindigt op `bouw-v18-production.mjs`, terwijl
`bouw-release-evidence.mjs` er al eerder achter is gezet. Productie en
deploy-preview blijven wel identiek, wat de test bedoelt te bewaken.
