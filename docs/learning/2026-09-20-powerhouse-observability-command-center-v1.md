# Powerhouse Control Center

## Doel

Eén dagelijkse cockpit waarin een mens kan zien wat Powerhouse werkelijk heeft gedaan, wat misging, wat hersteld is, wat geleerd is, welke skills veranderden en of delivery aantoonbaar terminal is.

## Wat je kunt analyseren

De cockpit heeft zeven perspectieven:
1. **Overzicht** — activiteit, errors, open aandacht, bewezen groen, actors en skills.
2. **Tijdlijn** — events op tijd, actor, laag, bron en status.
3. **Errors & herstel** — foutclusters/fingerprints en de meest recente afwijkingen.
4. **Lagen & systemen** — activiteit per architectuurlaag en component/platform health.
5. **Documentatie & learning** — Brain learning, ledger, menselijke documentatie, root cause, prevention en evidence.
6. **Skills** — expliciete skill- en projection-events.
7. **Delivery & bewijs** — GitHub/CI/release/readback-events plus waarde- en kostencontext.

Iedere view ondersteunt periode-, actor-, laag-, status- en bronfilters plus zoeken.

## Geen tweede waarheid

Het dashboard schrijft geen eigen operationele waarheid. De bestaande `/api/brain-operating-loop` blijft authority. Portal V2 normaliseert uitsluitend de reeds aanwezige records voor analyse en presentatie.

Als runtime-evidence ontbreekt, toont het dashboard geen verzonnen cijfers of groene status.

## Dagelijks gebruik

Start bij **Vandaag** om te zien wat er sinds de vorige werkdag is gebeurd. Filter daarna bijvoorbeeld op:
- status = errors/blokkades;
- laag = GitHub / Delivery;
- actor = specifieke agent/worker;
- bron = Supabase, Netlify, GitHub, Buffer, enz.;
- zoekterm = fingerprint, PR, skill, migration, provider of obligation.

Gebruik vervolgens de betreffende Brain/Powerhouse-pagina voor de operationele opvolging.

## Uitbreidingsrichting

De cockpit is voorbereid om later extra canonical evidence te tonen zoals tokengebruik, credits, CO₂/energie/water-proxy, queue latency, retries, GitHub runner-capaciteit, providerkosten, outcome/value per obligation en compliance/security findings — zodra deze gegevens in de centrale operating-loopprojectie beschikbaar zijn.
