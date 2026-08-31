# De sitestandaard — wat elke pagina automatisch krijgt

Vastgelegd 31 augustus 2026. Dit vervangt het besluit van 13 augustus dat de
site-chrome in `assets/kop.css` lag.

## De regel

**Eén standaard voor élke pagina, bestaand én nieuw.** Niemand hoeft er iets
voor te doen: de standaard wordt tijdens de build om de inhoud heen gebouwd.
Een blog die de weekblog-workflow morgen publiceert, krijgt hem vanzelf.

## Wat er tijdens de build gebeurt

De keten staat in `netlify.toml` onder `[build] command` en draait in deze volgorde:

1. `bouw-powerhouse-auth.mjs` — inlog van het klantportaal
2. `bouw-kennisindex.mjs` — kennisindex
3. `bouw-v18-production.mjs` — de homepage uit de vastgezette v18-payload,
   plus prijzen, cases en de inhoudspagina's uit `site/inhoudspaginas.json`
4. `apply-tabbladen.mjs` — tabbladtitels
5. **`bouw-v18-views.mjs`** — elke weergave uit de navigatie van de homepage
   wordt een echte pagina (`/product`, `/oplossingen`, `/systemen-koppelen`,
   `/prijzen`, `/over-ons`, `/cases`, `/zelfscan`, `/frisse-blik`, `/meer`,
   `/start`, `/inloggen`, `/aanmelden`). De navigatie is leidend: waar een oude
   pagina hetzelfde adres had, wordt die vervangen.
6. **`bouw-v18-chrome-alles.mjs`** — alle overige pagina's (koppelingen, kennis,
   blogs) gaan in dezelfde schil. Sluit als laatste de sitemap opnieuw, want pas
   dan bestaan alle pagina's.
7. `bouw-release-evidence.mjs` — bewijslast van de release

De bronbestanden in de repo blijven leesbare, eenvoudige HTML. De schil komt er
in de build omheen. Terugdraaien = stap 5 en 6 uit `netlify.toml` halen.

## Wat elke pagina krijgt

**Chrome**: de v18-kop met de volledige navigatie, de voettekst, en een hero die
begint met het merkblauw (`linear-gradient(135deg,#071a3c,#12316c)`), met de
herovideo erachter. Daaronder het kruimelpad met BreadcrumbList-schema.

**Opmaak**: de oorspronkelijke opmaak van de pagina gaat mee voor de structuur,
gescoopt onder `.inhoud-body` en ontdaan van wat zij op paginaniveau aan kleur,
achtergrond en lettertype zette. Die komen uit de v18-tokens. Zo houdt elke
pagina zijn indeling en krijgt hij toch één uiterlijk.

**Interactie** (`tools/v18-verrijking.mjs` en `tools/v18-modules.mjs`), afgeleid
uit wat er op de pagina staat:

| module | verschijnt wanneer |
| --- | --- |
| onderdelen komen op bij het scrollen | altijd |
| meelopende inhoudsopgave met scrollspy | drie of meer h2's |
| vragen die uitklappen | koppen die op een vraagteken eindigen |
| tellende bedragen en percentages | getallen in koppen of cijfervelden |
| aanvinkbare herkenningslijst met uitkomst | eerste lijst met vier of meer korte punten |
| stappen als meegroeiende tijdlijn | drie of meer genummerde h3's |
| sorteerbare tabel met verhoudingsbalk | tabel met drie of meer rijen |
| schuif door een prijsbereik | tekst met "€ x – € y" |
| ROI-rekenaar met eigen cijfers | elke pagina zonder eigen rekenwerk |
| "vraag het deze pagina" | altijd |
| overtyptest | pagina's over overtypen of dubbele invoer |
| "laat Peter vertrekken" | elke contentpagina |
| het lek dat doortikt | altijd |
| markeerstift onder de eerste zin van een sectie | maximaal vier per pagina |
| geeltjes bij het intypen van "geheugen" | altijd |

**Vindbaarheid**: eigen title, meta-omschrijving, canonical, og- en twitter-tags
per pagina; Organization-, WebPage- of BlogPosting- en BreadcrumbList-schema;
FAQPage-schema waar de pagina vragen beantwoordt; een auteursblok met foto voor
E-E-A-T; een blok met vervolgstappen dat naar zelfscan, Frisse blik, prijzen en
cases linkt — dat lost meteen weespagina's op.

## Harde afspraken

- **Alle eigen klassen beginnen met `bgx-`.** Zonder voorvoegsel kapen ze
  bestaande klassen. Dat gebeurde met `geeltje`, `streep`, `lek`, `lijn`,
  `bron`, `sub`, `net`, `vak`, `cijfer`, `meter` en `score`.
- **Scope-naam is `.inhoud-body`.** De gescoopte opmaak moet exact die naam
  gebruiken, anders doet geen enkele regel iets.
- **Nooit tekst verbergen zonder garantie dat ze terugkomt.** Verbergen gebeurt
  pas nadat het script draait; er is een meting bij elke scroll en een vangnet
  dat na anderhalve seconde alles alsnog toont.
- **De merknaam krijgt een hoofdletter, behalve na een lidwoord** ("een
  bedrijfsgeheugen" blijft klein) en **nooit in adressen** — dat breekt links.
- **Brede tabellen in `.bgx-tabelhouder`**, anders wrikt een tabel de pagina
  open op een telefoon.
- **Losse SVG's krijgen een maat.** Zonder maat worden ze zo breed als de kolom.

## Controle

`.github/scripts/seocontrole.py` toetst tegen de zoekwoord- en clusterstrategie
en vergelijkt kop en voet met `.github/canoniek/`. Die twee bestanden worden nu
tijdens de build uit een omgezette pagina geschreven, zodat de norm nooit meer
uit de pas loopt. De homepage is uitgezonderd van de kopvergelijking: daar staan
knoppen in plaats van links, omdat de eenpagina-app ermee schakelt.

Let op: beide controlescripts lezen de bestanden in de repo, niet de gebouwde
site. Zolang dat zo is, zien ze de schil niet. Ze moeten na de bouwstappen
draaien.
