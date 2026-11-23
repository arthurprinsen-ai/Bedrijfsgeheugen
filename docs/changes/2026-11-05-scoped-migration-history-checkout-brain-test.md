# BRAIN regressie — begrensde website-checkout en volledige migratiehistorie

5 november 2026 · Eigenaar: bestaande GitHub Required / ONE BRAIN CI-controles · Parent #4198 / #3742.

## Werkelijke fout

Bij het geslaagde beschermde merge van #5450 faalde de afzonderlijke BRAIN backend verifier run 42055116770 met zeven tests. Zes betroffen de kort na het merge achtergelopen provider-migratielock en werden afzonderlijk opgelost via gemergede #5462. Eén resterende test, `tests/brain-ci-control-plane-convergence-v1.test.mjs`, verbood nog `fetch-depth: 0` binnen de complete Required-workflow, terwijl #5453 juist de volledige basis→kandidaatgeschiedenis nodig had voor een nieuwe SQL-migratie. Het handhaven van de oude globale test zou de verbeterde migratiepreventie terugdraaien.

## Minimale reparatie

De originele test blijft controleren op alle Netlify/website/bounded-fetch-eisen, wijzigingsimpact en security. Alleen de verouderde wereldwijde Git-history-aanname wordt vervangen door een expliciete **enkele** `fetch-depth: 0` direct bij de gemarkeerde, originele migratie-preflight. De website-checkout moet nog altijd `fetch-depth: 0` weigeren. Geen wijzigingen aan SQL, Applied History, preview gates of runtime.

## Sluiting

Alleen groen na de beschermde Required, BRAIN en CodeQL op de exacte kandidaat-SHA, merge in `main` en onafhankelijke readback. Geen groene claim op basis van alleen dit testbestand.
