# GA4 Data Spine — geen stilzwijgende lege successen

## Wat er daadwerkelijk fout ging
De oorspronkelijke `bg-analytics-sync-composio` (Supabase Edge, zesuurscron #42) rapporteerde bij lege, authentieke Google Analytics 4-rapporten `HTTP 200`, `status=ok`, 0 regels, en `bg_bewijs(true)`. De originele Data Spine accepteerde alleen niet-lege GA4-batches als verse bronwaarneming, waardoor het systeem `STALE` bleef. Er was geen actuele actieve GA4-herstelverplichting; externe GitHub-commentaren activeerden de bestaande eigenaar niet.

De GA4-bron is historisch als `required=false` geregistreerd. Dit is **geen toestemming om ontbrekende conversiemetingen als succesvol te presenteren**. Wel blijft legitiem nulverkeer onderscheiden van ontbrekende toestemmingsafhankelijke brondata.

## Exacte reparatie binnen bestaande eigenaar
- Niets aan scheduler #42, writer, API-tokens, providerrecht, siteconsent, Buffer/Make of de bronarchitectuur.
- Het originele collectorpad behandelt 0 bronregels altijd als ontbrekende GA4-data (`source_data_available=false`) en meldt `bg_bewijs(false)`, maar beslist pas ná onafhankelijke aggregaat- en toestemmingsdiagnose of dit een echte fout (`NO_SOURCE_DATA`, HTTP503, `bg_ga4_sync=error`) of een legitieme privacybeperking (`CONSENT_LIMITED`, HTTP200 voor geslaagde transportcontrole maar `bg_ga4_sync=privacy_limited`) is.
- Een onafhankelijke GA4-aggregaatquery test of er sessies/events bestaan terwijl de dimensiequery 0 geeft. Daarnaast onderzoekt de originele service via alleen een minimale ja/nee-query of er in dezelfde UTC-dag überhaupt niet-robot website-events met analytics-toestemming voorkwamen. Is dat niet zo én GA4-aggregaat 0, dan wordt geen Google-storing verzonnen en schakelt CRO niet om naar ongeoorloofde GA4-tracking. Bij mislukte query blijven cijfers `UNKNOWN`.
- De functie creëert of actualiseert via bestaande `brain_create_obligation` + `brain_transition_obligation` CAS één structurele, eigen `MEASUREMENT_REPAIR` verplichting. Na een eerder afgerond incident krijgt de volgende dag een nieuwe idempotente herstelidentiteit.
- De oude route voor echte, niet-lege brondata, bestaande authenticatie en goedgekeurde Windsor-auth-failover blijven onveranderd.

## Veiligheid en onafhankelijke afsluiting
De productie staat **niet groen** door deze kandidaat. Echte afsluiting vereist: originele Required/BRAIN/CodeQL, beschermde merge, Supabase-provider deploy + runtimehash, natuurlijke broncron #42, originele log `ga4_source_empty_observed` of providerwaarneming met echte meetdata, correcte actuele Data Spine en Brain/skill/ledger-registratie. Geen namaak 0-sessies, geen ongeautoriseerde externe betaalde route of directe database-aanpassing van bronwaarheid.

Verplichting in productie: `dee955d9-9e90-43f3-9b8a-2257bce3f1a5` (READY bij bronkandidaat). Ouder: #4198.

## Onafhankelijke privacybronbevinding (vervolg van historische diagnose)
De originele `bg_interacties` liet op 2 en 3 november respectievelijk **89 en 85 menselijke sessies zonder GA4-toestemming, en 0 menselijke sessies mét toestemming** zien. Op 1 november was er één sessie met toestemming en waren er drie niet-lege GA4-rapportregels. Ruwe eventdata bevat ook veel robots. Eerste diagnose 'GA4 kapot' is daarom onvoldoende; dit kan legitiem consent-limited zijn. Eigen privacyarme website-interacties blijven apart bruikbaar voor CRO, maar worden nooit als GA4-bezoek of als goedgekeurde Google-consent doorgestuurd.
