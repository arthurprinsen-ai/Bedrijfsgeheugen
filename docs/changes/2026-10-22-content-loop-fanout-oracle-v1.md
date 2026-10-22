# 22 oktober 2026 — BRAIN generator-oracle na kanaalgerichte fan-out

## Bewijs en hoofdoorzaak
Unified BRAIN [#39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071) op PR #4641 exact head `8e665a86d2bb54712a34fd88bec0e1213df21dd2` telde 3.526 tests, 3.171 geslaagd en 355 gefaald. Eén faalregel in `tests/brain-anthropic-subcall-deadline-p0-4198.test.mjs` verwacht `MAX_CHANNEL_GENERATIONS = 1` en `bootstrapAttempted`, die niet meer voorkomen in de huidige canonieke supervisor.

De supervisor selecteert werkelijk uitsluitend `publish/decided` kanalen, beperkt de lijst tot de vier canonieke kanalen en genereert per kanaal via de bestaande orchestrator. Bij een onzekere of nog lopende bootstrap wordt geen tweede generatie gestart. De bestaande 90s Anthropic- en 110s supervisorlimieten en expliciete provider-side-effect / receipt-guards moeten behouden blijven. Een globale limiet van één generatie opnieuw toevoegen zou veilige andere kanalen blokkeren.

## Veilig gerichte correctie
Alleen de bestaande test wordt met broncorrecte beschermende assertions aangepast. Geen productiecode, SQL, scheduler, verzendactie, token of provider wordt gewijzigd. Canonieke Brain-learning en append-only ledger leggen de afwijking en herhalingspreventie vast voor nieuwe agents.

## Afsluiting uitsluitend met bewijs
Vereist: gerichte test, exact-head Required CI en CodeQL, historische/shadow/canary-toelating, en volledige gecombineerde Unified BRAIN met 0 fouten; daarna passende beschermde release en registry/skillprojectie readback. Deze geïsoleerde kandidaat herstelt niet automatisch de overige 354+ fouten of #3742 migratiepariteit en #4215 tenantacceptatie.
