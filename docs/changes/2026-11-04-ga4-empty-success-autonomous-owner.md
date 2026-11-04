# GA4 Data Spine — geen stilzwijgende lege successen

## Wat er daadwerkelijk fout ging
De oorspronkelijke `bg-analytics-sync-composio` (Supabase Edge, zesuurscron #42) rapporteerde bij lege, authentieke Google Analytics 4-rapporten `HTTP 200`, `status=ok`, 0 regels, en `bg_bewijs(true)`. De originele Data Spine accepteerde alleen niet-lege GA4-batches als verse bronwaarneming, waardoor het systeem `STALE` bleef. Er was geen actuele actieve GA4-herstelverplichting; externe GitHub-commentaren activeerden de bestaande eigenaar niet.

De GA4-bron is historisch als `required=false` geregistreerd. Dit is **geen toestemming om ontbrekende conversiemetingen als succesvol te presenteren**. Wel blijft legitiem nulverkeer onderscheiden van ontbrekende toestemmingsafhankelijke brondata.

## Exacte reparatie binnen bestaande eigenaar
- Niets aan scheduler #42, writer, API-tokens, providerrecht, siteconsent, Buffer/Make of de bronarchitectuur.
- Het originele collectorpad behandelt 0 bronregels als `NO_SOURCE_DATA` en `HTTP503`, logt dit als brongebrek, maakt `bg_ga4_sync` `error` en meldt `bg_bewijs(false)`.
- Een onafhankelijke GA4-aggregaatquery test of er sessies/events bestaan terwijl de dimensiequery 0 geeft. Bij mislukte query blijven cijfers `UNKNOWN`.
- De functie creëert of actualiseert via bestaande `brain_create_obligation` + `brain_transition_obligation` CAS één structurele, eigen `MEASUREMENT_REPAIR` verplichting. Na een eerder afgerond incident krijgt de volgende dag een nieuwe idempotente herstelidentiteit.
- De oude route voor echte, niet-lege brondata, bestaande authenticatie en goedgekeurde Windsor-auth-failover blijven onveranderd.

## Veiligheid en onafhankelijke afsluiting
De productie staat **niet groen** door deze kandidaat. Echte afsluiting vereist: originele Required/BRAIN/CodeQL, beschermde merge, Supabase-provider deploy + runtimehash, natuurlijke broncron #42, originele log `ga4_source_empty_observed` of providerwaarneming met echte meetdata, correcte actuele Data Spine en Brain/skill/ledger-registratie. Geen namaak 0-sessies, geen ongeautoriseerde externe betaalde route of directe database-aanpassing van bronwaarheid.

Verplichting in productie: `dee955d9-9e90-43f3-9b8a-2257bce3f1a5` (READY bij bronkandidaat). Ouder: #4198.
