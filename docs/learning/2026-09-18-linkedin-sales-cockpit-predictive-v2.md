# LinkedIn Sales Cockpit predictive v2 — production learning

Op 18 september 2026 is de bestaande Powerhouse Revenue Command Center doorontwikkeld tot een snellere predictive sales cockpit. Er is bewust geen tweede cockpit of CRM naast gebouwd.

## Wat nu live staat

De cockpit bevat snelle search/filter, focus op de hoogste prioriteitsactie, J/K-navigatie, C voor copy en Enter voor de concrete bron. De actiekaarten kunnen buying-window heat, relationship warmth, company intent, forecast probability en revenue density tonen wanneer die gegevens werkelijk uit de canonieke sales intelligence komen.

De bestaande evidence-first grenzen blijven intact: geen generieke LinkedIn-feed als bewijs, geen verzonnen tekst zonder context en geen auto-send.

## Productiebewijs

PR #2082 is beschermd gemerged als `54ab849124e4d9d9bde498e998c50d8865c9712c`. Netlify deploy `6aad09ac00d5f50008121b25` rapporteerde `state=ready`, `context=production` en exact dezelfde `commit_ref`.

## Delivery-learning

PR #2078 bevatte inhoudelijk geldige cockpitcode, maar de eerste BRAIN-run zag een pull_request-event zonder de vereiste delivery-metadata. Latere metadatawijzigingen veranderen dat oude event niet. Toen main daarna ook bewoog, is de stale candidate gesloten en vervangen door één expliciete recovery-candidate (#2082) vanaf actuele main.

Preventieregel: delivery metadata vóór PR-open; event snapshots als immutable behandelen; bij verloren synchronize-semantiek plus bewegende main één canonical successor gebruiken; production pas claimen wanneer deploy identity overeenkomt met de beschermde merge.

## Reusable product principle

De cockpit is een **sales decision surface**, geen rapportagedashboard. Elke uitbreiding moet de vraag sneller beantwoorden: wie verdient nu aandacht, waarom nu, welke concrete actie is bewijsbaar passend, en wat leert de uitkomst voor de volgende beslissing?
