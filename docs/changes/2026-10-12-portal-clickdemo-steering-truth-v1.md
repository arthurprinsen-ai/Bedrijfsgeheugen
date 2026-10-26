# Dagelijkse bedrijfssturing — commerciële klikdemo consistent

## Real source observation
Canonieke Portal V2 is op 12 oktober 2026 in productie gemerged onder PR #4347 (SHA `51bdf9deec401c0f59e548a938f4b11542c1703d`) en rechtstreeks op de publieke pagina geverifieerd. De aparte `/klantportaal-demo` (noindex) bleef nog starten met losse wijzigingen, rechten, dashboard en systeemuitleg.

## Wat wijzigt
- Eén doelgerichte introductie op de bestaande klikdemo: dagelijkse ondernemingssturing is meer dan een AI-tool of dashboard.
- Vijf interactieve storytelling-stappen openen uitsluitend bestaande demo-tabbladen via de bestaande `data-tab` en `ganaar()` navigatie. **Geen nieuw menu, router, datamodel of ongedocumenteerde koppeling.**
- Getoonde intern opgenomen informatie → impact op strategie → besluiten → taken → controle op vastgelegde versies. De demoversie pretendeert geen live externe signalen, volledig geautomatiseerde businesssturing of gerealiseerde winst.
- Demo-label en tekst onderscheiden fictieve personen, scores, acties en KPI's expliciet van geverifieerde echte klantdata.
- Link wijst rechtstreeks naar `https://www.bedrijfsgeheugen.nl/portal-v2/`, de canonieke portaalervaring.
- Bestaande functionaliteit voor gebruikersrollen, rechten, versies, veranderen/goedkeuren, navigatie en toestanden blijft onaangeroerd.

## Verificatie
Test `tests/brain-website-portal-clickdemo-steering-truth-v1.test.mjs`, beschermd Required/CodeQL/website CI, Netlify preview, vijf klikroutes en mobile layout, exact production deploy SHA en live HTML/JS-rendered readback. Geen echte order of commerciële resultaten claimen voordat de uitkomsten onafhankelijk bewezen zijn.

Bredere regressie/previewfout in Supabase is los van dit HTML-bestand: productie heeft migration ledger versies die niet gelijklopen met de lokale SQL-bestandsnamen. Niet op datum raden of productiemigraties opnieuw draaien; herstel vraagt eerst source-to-ledger mapping.
