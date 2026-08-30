# Canonical SEO Footer Contract

Fingerprint: `canonical-seo-footer-v1`  
Owner: `website-seo`  
Scopes: `component:footer`, `area:seo`

## Eén waarheid

`.github/canoniek/voet.html` is de enige canonieke footerbron. `site/footer-contract.json` bepaalt welke publieke/indexeerbare HTML-pagina's de footer verplicht krijgen, welke expliciete uitzonderingen bestaan en welke strategische bestemmingen sitewide ondersteund worden.

Footerwijzigingen zijn altijd SEO-wijzigingen. Een footerwijziging mag niet promoveren wanneer de footer-, route-, keyword-owner-, technische SEO-, preview- of productie-gate rood is.

## Zoekwoord- en linkregels

De footer ondersteunt de bestaande zoekwoordstrategie uit `site/seo-baseline.json`; hij maakt geen tweede waarheid. Eén primair zoekwoord houdt één owner-route. Exacte zoekwoordankers mogen niet naar een concurrerende route wijzen. Alle interne footerlinks moeten bestaan en publiek crawlbaar zijn. Contextuele clusterlinks blijven in de pagina-inhoud; de footer is de stabiele site-architectuurlaag en mag niet worden gebruikt voor keyword stuffing.

## Governed coverage en uitzonderingen

De governed set omvat root-HTML, `blog/index.html` en `blog/*/index.html`. De bloglanding mag dus nooit stil buiten de footer-injectie vallen. Iedere exception in `site/footer-contract.json` moet een bestaand bestand, een concrete reden en aantoonbaar `noindex`-gedrag hebben; een verouderde uitzondering is een releasefout en wordt niet stil geaccepteerd.

## V18-grens

De historische V18 blijft beschermd. De canonieke footer is de expliciete toegestane uitzondering binnen de body. `tests/v18-footer-boundary.test.mjs` bewijst dat een footerwijziging geen niet-footer V18-body mag veranderen en valideert de werkelijke aanroepvolgorde, niet alleen een import/declaratie.

## Self-heal

Structurele footerdrift mag automatisch worden hersteld: ontbrekende footer opnieuw injecteren, afwijkende footer vervangen door de canonieke bron en een aantoonbaar foutieve interne route herstellen naar de reeds vastgelegde route. Dit is **structural auto-repair**.

Een semantische wijziging van keyword owner, zoekwoord-eigenaar, primaire intentie of strategische bestemming is geen structurele reparatie. Zo'n wijziging vereist een expliciete contractwijziging, regressietests en opnieuw groene SEO-gates.

Publieke smokes gebruiken bounded retries: maximaal twee identieke retries zonder nieuwe evidence en alleen voor transient netwerk/reset/429/5xx-fouten. Deterministische 4xx, contentdrift of contractfouten falen direct en vereisen een nieuwe hypothese in plaats van blind opnieuw proberen.

## Verplichte gates

- `tests/footer-contract.test.mjs`
- `tests/footer-injection.test.mjs`
- `tests/footer-seo.test.mjs`
- `tests/v18-footer-boundary.test.mjs`
- `tests/footer-public-smoke-contract.test.mjs`
- `tests/public-footer-fetch-retry.test.mjs`
- `tests/shared-footer-agent-contract.test.mjs`
- `node tools/validate-footer-seo.mjs`
- publieke preview-smoke via `tools/verify-public-footer.mjs`
- publieke productie-smoke op de exacte `main`-SHA

De volgorde is **preview-before-production**. Een lokaal of CI-groen resultaat is geen productie-evidence.

## Agent-memory en completion

Iedere huidige en toekomstige agent die footer, websitebouw, navigatie-SEO, interne links of keyword ownership raakt, voert eerst de canonieke BRAIN chat-learning preflight uit via `config/brain-chat-learning-contract.json` en erft de chat-learning completeness-regels uit `config/chat-learning-completeness-guard.json`. Er bestaat geen tweede footer- of agentgeheugen naast die canonieke Brain-laag.

Materiële wijzigingen worden als `CONTRACT_CHANGE`, `IMPROVEMENT`, `RECOVERY` of `PRODUCTION_PROMOTION` naar het gedeelde geheugen geschreven. **writeback-before-done** is verplicht: een taak is niet compleet zolang fingerprint, root cause, mislukte aanpak, fix, preventieregel, regressiecontract en evidence alleen in chattekst staan. Daarna moet de gedeelde context worden ververst/readback-gecontroleerd. Een agent mag geen gate verzwakken om een wijziging groen te krijgen.
