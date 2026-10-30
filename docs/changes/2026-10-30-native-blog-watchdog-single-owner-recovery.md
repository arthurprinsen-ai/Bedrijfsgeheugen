# Herstel Native Content Growth — oude watchdog blijft read-only
**30 oktober 2026 · Oorspronkelijke eigenaar:** Content Growth / Source Universe / ONE BRAIN. Gerelateerd aan P0 #4439.

## Oorzaak op bewijs
GitHub `Native Content Growth Contracts` workflow #41034792790 job #123992869752 faalde op de beschermde `main` na PR #5186: **68 tests geslaagd, 1 mislukt**. De falende test `tests/content-growth-daily-blog-watchdog-recovery.test.mjs` verwachtte dat de oude GitHub-blogwatchdog onafgeronde historische `days` moest selecteren en `BASE_SHA` voorbereiden voor herstel. Dat gedrag is inmiddels bewust verwijderd: de originele Supabase `content_publication_obligations` plus `powerhouse-blog-queue` en de beschermde `powerhouse-daily-blog.yml` zijn de enige publicatieautoriteit. De oude watchdog heeft bewust alleen `contents: read`, controleert de actuele Europe/Amsterdam-businessdate en leest bestaand openbaar bewijs zonder eigen writes.

## Herstel
De test bewaakt nu de **werkelijke exclusieve eigenaarsgrens** in plaats van de vervallen fallback: checkout `main`, actuele lokale businessdate, expliciete no-action wanneer de oude ledger de datum niet kent, geen lookup naar oudere onafgeronde data, geen `BASE_SHA`, git push/commit, nieuw PR of private proof export, en uitsluitend publieke live-readback. De workflow zelf, bestaande scheduler, publieke blog, OAuth en publisher worden **niet** aangepast.

## Tweede, echte bronkwaliteitcorrectie
Het oorspronkelijke 30 oktober-blogconcept meldde onjuist dat CPNL 2026 op 6 oktober opende. RVO bevestigt dat de aanvraagperiode 21 april t/m 6 oktober 2026 liep, zie https://www.rvo.nl/subsidies-financiering/cpnl. Het concept werd binnen de oorspronkelijke ongepubliceerde asset gecorrigeerd; de bestaande datumguard accepteerde de nieuwe tekst en de *natuurlijke* blogqueue ging van HTTP 422 (09:29 UTC) naar HTTP 200 (09:34 UTC). De oorspronkelijke verplichting bleef `GENERATED` zonder publicatie-ID, dus **geen bewezen publieke post**. BRAIN-observatie heeft fingerprint `powerhouse|blog|official-cpnl-date-inverted|20261030-v1`, maturity OBSERVED. Generator-prewrite-datumcontrole is nog NIET geïmplementeerd of live; claim dat niet.

## Acceptatie
Deze regressie alleen groen als de originele, toekomstige Content Growth workflow weer echt 69/69 haalt, protected Required/CodeQL en native main readback bevestigen. Voor portaal/live claims afzonderlijk Netlify exact SHA en oorspronkelijke 15-lussen-/CRO readback. Nooit 15/15 GREEN, omzet of sociale provider-ID claimen uit deze CI-test. Andere lopende original-owner PRs niet overschrijven.
