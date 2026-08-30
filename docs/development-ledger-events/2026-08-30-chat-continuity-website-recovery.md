# 2026-08-30 — CHAT CONTINUITY / WEBSITE RECOVERY

## Doel
Deze entry borgt de materiële kennis uit de website-herstelchat zodat nieuwe chats, agents, GitHub-workflows, Netlify-releases en toekomstige herstelacties **niet opnieuw vanaf nul beginnen**.

Dit document is operationeel geheugen, geen vrijblijvende samenvatting. Gebruik de fingerprints, failed approaches, fixes en regressiecontracten hieronder als voorafgaande kennis bij iedere gerelateerde wijziging.

## Canonieke bron en release-identiteit
- Geaccepteerde test-prototypebron voor de teruggebrachte hoofdviews: PR #110, head `5a8cc121691200231f9b7a00eed5fdcff9764678`, bestand `prototype-v18-6.html`.
- Productie-/preview-identiteit wordt **nooit** afgeleid uit alleen branchnaam of PR-nummer. De release-identiteit is altijd: **exacte commit SHA + exact Netlify deploy/artifact + groene runtime evidence**.
- De herstel-PR is PR #187 `Restore missing pages from accepted test environment` op branch `restore/test-prototype-pages`.
- De functioneel bewezen herstelinhoud stond groen op SHA `eb27982ecc5f25af06a71333a52a91f7d7a78b30`.
- Daarna ontstond een inhoudelijk no-op commit `a0d62443bc8e70bd59e19255d9c11fa42d44a56b`; daardoor draaiden de gates opnieuw. No-op commits op een releasekandidaat moeten in vervolg worden vermeden omdat ze CI/Netlify onnodig opnieuw laten bouwen.
- PR #187 blijft test/preview-only zolang visuele/business-acceptatie niet expliciet is gegeven; geen agent mag die safeguard stil verwijderen.

## Protected routecatalogus
De geaccepteerde primaire testviews zijn:
- `/problemen`
- `/oplossingen`
- `/bedrijfsgeheugen` (label: Platform)
- `/prijzen`
- `/cases`
- `/kennis`
- `/over-ons`

Accountviews die als echte routes moeten blijven bestaan:
- `/inloggen`
- `/aanmelden`

CTA:
- `/frisse-blik`

Deze catalogus staat machineleesbaar in `site/navigation-baseline.json`. Desktop en mobiel zijn verschillende presentaties van **dezelfde inhoudelijke routecatalogus**.

## Fingerprint 1 — semantic content drift ondanks technisch groene pagina
**Fingerprint:** `website|semantic-content-drift|technically-green-but-wrong`

**Symptoom:** route bestaat, HTTP/HTML/SEO zijn geldig, maar pagina-inhoud, propositie, verhaal of navigatiepositie wijkt af van de geaccepteerde versie.

**Root cause:** technische healthchecks behandelden HTML-validiteit als voldoende bewijs en beschermden de betekenis van de pagina onvoldoende.

**Bewezen fix:** accepted baseline + semantic anchors + machine-readable navigation baseline + `tests/site-baseline-guardian.test.mjs` als productiepoort.

**Regel:** een recenter bestand of commit is niet automatisch de juiste inhoud. Herstel uit accepted last-known-good en behoud additieve security/Brain/portal/infrastructuurverbeteringen.

## Fingerprint 2 — te trage pagina-voor-pagina reconstructie
**Fingerprint:** `website|recovery|slow-page-by-page-archaeology`

**Symptoom:** herstel duurt te lang omdat iedere pagina opnieuw historisch wordt gereconstrueerd terwijl er al een geaccepteerde testbaseline bestaat.

**Failed approach:** losse pagina’s opnieuw interpreteren of herschrijven op basis van gedeeltelijke herinneringen.

**Bewezen snellere aanpak:**
1. bepaal eerst de accepted baseline;
2. vergelijk huidige repo tegen die baseline;
3. herstel alleen aantoonbare afwijkingen;
4. behoud alle recente niet-conflicterende technische verbeteringen;
5. verifieer de complete routecatalogus in één run.

**Regel voor agents:** bij een bestaande accepted baseline geen brede reconstructie uitvoeren. Eerst diff + invariant check, daarna alleen minimale oorzaakgerichte changes.

## Fingerprint 3 — gedeelde header/footer te laat via runtime-JS
**Fingerprint:** `website|shared-shell|domcontentloaded-race`

**Symptoom:** Live Preview Smoke zag op herstelde pagina’s bij `DOMContentLoaded` nog geen mobiele `Menu openen`-knop omdat de gedeelde V18-shell pas later door JS werd geïnjecteerd.

**Root cause:** bron-HTML bevatte shell-markers; runtime-injectie maakte de DOM pas na het moment waarop browseracceptatie al controleerde.

**Failed approach:** runtime-injectie als enige eigenaar behandelen voor zowel browser- als brongebaseerde checks.

**Bewezen fix:** gedeelde canonieke shell behouden als één bron, maar voor brongebaseerde CI-checks statisch materialiseren via `.github/scripts/sitecustomize.py`; browserruntime gebruikt dezelfde canonieke shell. Geen tweede inhoudelijke navigatiebron maken.

**Regressiegates:** `Live Preview Smoke` + `Pagina- en SEO-controle`.

## Fingerprint 4 — dubbele mobiele menu-eigenaren
**Fingerprint:** `website|mobile-nav|duplicate-controller`

**Symptoom:** een aparte herstelde-pagina drawer/controller dreigde af te wijken van de centrale V18 mobiele navigatie.

**Root cause:** een compatibiliteitsbestand werd als tweede gedragseigenaar getest terwijl `assets/js/menu.js` al de productie-eigenaar was.

**Failed approach:** twee mobiele menu-implementaties onderhouden en beide op `aria-expanded`, Escape, open/sluitgedrag etc. laten concurreren.

**Bewezen fix:** `assets/js/menu.js` is de **enige** mobiele gedragseigenaar. `assets/test-prototype-pages.js` blijft alleen compatibility marker en bevat geen tweede drawerlogica.

**Regel:** regressietests moeten de echte canonical owner testen, niet een oude kopie-eis in stand houden.

## Fingerprint 5 — bron-SEO en runtime-DOM zien verschillende werkelijkheid
**Fingerprint:** `website|seo|runtime-shell-vs-source-parser`

**Symptoom:** browsercontrole was groen, maar brongebaseerde pagina/SEO-checks konden links/header/footer niet zien.

**Root cause:** SEO-parser leest statische bron; browser ziet runtime-DOM.

**Bewezen fix:** voor CI-broncontroles exact dezelfde canonieke header/footer materialiseren voordat parserchecks draaien. Productcode hoeft daarvoor niet gedupliceerd te worden.

**Regel:** wanneer een checker een andere representatie consumeert dan productie-runtime, maak de transformatiestap expliciet en deterministisch; verzwak de checker niet.

## Fingerprint 6 — herstelde route wordt SEO-weespagina
**Fingerprint:** `website|seo|restored-route-orphan`

**Symptoom:** `/kennis` bestond en werkte maar had binnen de herstelde pagina-cluster geen inkomende contextlink.

**Root cause:** routeherstel focuste eerst op bestaan/runtime, niet op interne vindbaarheid.

**Bewezen fix:** echte contextlinks toevoegen in relevante pagina-inhoud; niet alleen routebestaan in een test whitelisten.

**Regel:** iedere herstelde commerciële/kennisroute moet minimaal één logische inkomende interne link hebben naast globale navigatie waar relevant.

## Fingerprint 7 — regressietest bewaakt oude implementatie in plaats van bedoeling
**Fingerprint:** `tests|implementation-coupling|stale-assertion`

**Symptoom:** V18 Production Promotion bleef rood terwijl browser en SEO al groen waren; de guardian eiste dat iedere losse HTML-pagina zelf alle primaire `href`s bevatte en later dat een compatibility-JS de mobiele controllerlogica bevatte.

**Root cause:** assertions waren gekoppeld aan een oude copy-paste implementatie in plaats van de actuele architectuur en invariant.

**Bewezen fix:** test de bedoeling op de juiste laag:
- pagina gebruikt canonical shared shell;
- navigation baseline bevat de zeven protected routes;
- centrale menu-owner bevat open/sluit/`aria-expanded`/Escape;
- pagina-cluster is contextueel verbonden.

**Regel:** een rode test mag niet simpelweg worden verwijderd of versoepeld. Eerst bepalen of product of test verkeerd is. Bij stale implementation coupling de test herschrijven naar dezelfde of sterkere business-/architectuurinvariant.

## Fingerprint 8 — wijzigen vóór concrete failure-evidence
**Fingerprint:** `delivery|debugging|speculative-fix-loop`

**Symptoom:** risico op extra wijzigingen terwijl niet duidelijk was welke gate daadwerkelijk rood was.

**Bewezen werkwijze:** exact één rode gate lezen, concrete failure isoleren, minimale oorzaakfix uitvoeren, daarna dezelfde SHA opnieuw testen.

**Regel:** geen breed 'opruimen' terwijl een release rood is. Iedere iteratie moet nieuw bewijs opleveren en de changed scope klein houden.

## Fingerprint 9 — mutable `main` / parallel agents
**Fingerprint:** `github|parallel-agents|moving-main`

**Symptoom:** main veranderde tijdens herstel door andere agents/workflows.

**Root cause:** simultane ontwikkeling is gewenst, maar releasewerk kan daardoor op stale base worden beoordeeld.

**Bewezen regel:**
- voor iedere merge/write die afhankelijk is van repository state eerst actuele `main`/base lezen;
- niet-conflicterende lanes mogen parallel doorwerken;
- exacte kandidaat-SHA blijft release-identiteit;
- alleen echte overlap/conflict/dependency-drift vereist rebase/synchronisatie.

## Bewezen groene gates voor de herstelinhoud
Op `eb27982ecc5f25af06a71333a52a91f7d7a78b30` zijn aantoonbaar groen geweest:
- `V18 Production Promotion` — PASS;
- `Live Preview Smoke` — PASS;
- `Pagina- en SEO-controle` — PASS;
- `Shared Agent Memory Tests` — PASS;
- Netlify preview gekoppeld aan de exacte head SHA;
- V18.8 HTML-contract — PASS;
- lokale hero-video asset — PASS;
- browserruntime/navigatie — PASS;
- desktop capture — PASS;
- mobile capture — PASS.

Een latere SHA mag alleen dezelfde status erven als de inhoud byte-equivalent/no-op is én de gates op die SHA opnieuw groen zijn, of wanneer de delivery-controller dit expliciet als equivalent artifact bewijst.

## Sneller ontwikkelen — verplichte optimalisaties uit deze chat
1. **Accepted baseline eerst.** Nooit opnieuw zoeken naar wat 'waarschijnlijk' correct was als er een goedgekeurde baseline is.
2. **Eén diff, één inventaris.** Bepaal in één compare welke protected pagina’s werkelijk verschillen; herstel niet blind alles.
3. **Één eigenaar per concern.** Eén canonical header/footer, één mobiele menu-controller, één navigation catalog.
4. **Test de invariant, niet de kopie.** Geen regressietests die duplicatie afdwingen.
5. **Parallel waar onafhankelijk.** Browser, SEO, memory en integration mogen simultaan draaien; serialiseer alleen echte dependencies.
6. **Exacte failure → minimale fix.** Geen brede refactors in een rode release.
7. **Vermijd no-op commits.** Administratieve wijzigingen horen in PR-metadata, niet in bronfiles, omdat iedere SHA nieuwe buildkosten en wachttijd veroorzaakt.
8. **Preview is bewijs, geen productie.** Test-only/draft safeguards blijven actief tot de expliciete acceptatieconditie is voldaan.
9. **Geen groen zonder outcome.** Route moet niet alleen bestaan; content, interne vindbaarheid, responsive navigatie en runtime moeten kloppen.
10. **Writeback verplicht.** Na iedere materiële fout/fix/regressie nieuwe fingerprint + outcome + preventieregel naar ledger/shared memory schrijven.

## Instructie voor iedere nieuwe chat/agent
Bij website-, navigatie-, SEO-, Netlify-, GitHub- of herstelwerk:
1. zoek eerst op de fingerprints in dit document en `docs/development-ledger.md`;
2. lees `site/accepted-baseline.json` en `site/navigation-baseline.json` vóór content- of routewijzigingen;
3. gebruik existing fixes/regressiegates voordat nieuwe architectuur wordt bedacht;
4. schrijf alleen nieuwe kennis terug wanneer die aantoonbaar nieuw is;
5. voorkom duplicaatwerk tussen chats/agents via shared-context read en material-outcome writeback.

## Herbruikbare eindles
De grootste versnelling komt niet van meer wijzigingen tegelijk, maar van **minder opnieuw ontdekken**: accepted truth vastzetten, exacte failure-evidence gebruiken, één canonical owner per concern, parallelle onafhankelijke gates en iedere bewezen fout/fix als fingerprint terugschrijven naar het gedeelde Brain.