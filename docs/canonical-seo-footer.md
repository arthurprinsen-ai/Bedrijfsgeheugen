# Canonical SEO Footer Contract

Fingerprint: `canonical-seo-footer-v1`  
Owner: `website-seo`  
Scopes: `component:footer`, `area:seo`

## Eén waarheid

`.github/canoniek/voet.html` is de enige canonieke footerbron. `site/footer-contract.json` bepaalt welke publieke/indexeerbare HTML-pagina's de footer verplicht krijgen, welke expliciete uitzonderingen bestaan en welke strategische bestemmingen sitewide ondersteund worden.

Footerwijzigingen zijn altijd SEO-wijzigingen. Een footerwijziging mag niet promoveren wanneer de footer-, route-, keyword-owner-, technische SEO-, preview- of productie-gate rood is.

## Zoekwoord- en linkregels

De footer ondersteunt de bestaande zoekwoordstrategie uit `site/seo-baseline.json`; hij maakt geen tweede waarheid. Eén primair zoekwoord houdt één owner-route. Exacte zoekwoordankers mogen niet naar een concurrerende route wijzen. Alle interne footerlinks moeten bestaan en publiek crawlbaar zijn. Contextuele clusterlinks blijven in de pagina-inhoud; de footer is de stabiele site-architectuurlaag en mag niet worden gebruikt voor keyword stuffing.

## V18-grens

De historische V18 blijft beschermd. De canonieke footer is de expliciete toegestane uitzondering binnen de body. `tests/v18-footer-boundary.test.mjs` bewijst dat een footerwijziging geen niet-footer V18-body mag veranderen.

## Self-heal

Structurele footerdrift mag automatisch worden hersteld: ontbrekende footer opnieuw injecteren, afwijkende footer vervangen door de canonieke bron en een aantoonbaar foutieve interne route herstellen naar de reeds vastgelegde route. Dit is **structural auto-repair**.

Een semantische wijziging van keyword owner, zoekwoord-eigenaar, primaire intentie of strategische bestemming is geen structurele reparatie. Zo'n wijziging vereist een expliciete contractwijziging, regressietests en opnieuw groene SEO-gates.

## Verplichte gates

- `tests/footer-contract.test.mjs`
- `tests/footer-injection.test.mjs`
- `tests/footer-seo.test.mjs`
- `tests/v18-footer-boundary.test.mjs`
- `tests/footer-public-smoke-contract.test.mjs`
- `tests/shared-footer-agent-contract.test.mjs`
- `node tools/validate-footer-seo.mjs`
- publieke preview-smoke via `tools/verify-public-footer.mjs`
- publieke productie-smoke op de exacte `main`-SHA

## Agent-memory

Iedere huidige en toekomstige agent die footer, websitebouw, navigatie-SEO, interne links of keyword ownership raakt, hergebruikt `BRAIN-CHAT-LEARNING-v1` uit `brain/memory/chat-learning-registry.json` plus dit contract. Materiële wijzigingen worden als `CONTRACT_CHANGE`, `IMPROVEMENT`, `RECOVERY` of `PRODUCTION_PROMOTION` naar het gedeelde geheugen geschreven. Een agent mag de gate niet verzwakken om een wijziging groen te krijgen.
