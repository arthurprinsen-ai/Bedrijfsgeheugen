# Powerhouse Growth Swarm v1 — 28 september 2026

## Wat is gebouwd
De losse growth-ideeën zijn samengevoegd tot één commerciële Powerhouse-laag. De Growth Swarm gebruikt dezelfde relationship graph, trigger intelligence, scans, benchmarks, LinkedIn engagement, growth events, opportunities, content recommendations, outcomes en learning.

De 20 canonieke plays zijn machineleesbaar vastgelegd in `config/powerhouse-growth-swarm-playbook-v1.json` én in de live tabel `powerhouse_growth_play_catalog_v1`.

## Runtime
Nieuwe productiecomponenten:
- `powerhouse_growth_swarm_accounts_v1`: één afgeleide commerciële state per bedrijf;
- `powerhouse_revenue_swarm_v1`: revenue ranking;
- `powerhouse_dark_funnel_intent_v1`: account-level intentconvergentie;
- `powerhouse_friction_index_v1`: privacy-safe scanbenchmark;
- `powerhouse_workshop_leaderboard_v1`: anonieme workshoppercentielen;
- `powerhouse_lost_knowledge_value_v1`: scenario-calculator;
- `powerhouse_ma_knowledge_execution_risk_v1`: M&A Knowledge & Execution Risk;
- `powerhouse_refresh_growth_swarm_v1`: cross-domain refresh;
- `powerhouse_materialize_growth_swarm_v1`: dossiers + runtime play-events;
- Edge Function `powerhouse-growth-tools`: publieke benchmark/calculator API en private Revenue Swarm readback.

## Alles hangt samen
De commerciële cyclus is nu:
relationship intelligence -> research -> buying trigger -> Growth Swarm -> prebuilt dossier/play selection -> LinkedIn Sales Machine -> autonomous private outreach -> commercial learning.

SEO en Problem Radar zijn demand/intent inputs; scans/workshops zijn evidence/benchmark inputs; LinkedIn en websitegedrag zijn intentfeatures; M&A/knowledge/friction zijn value hypotheses; content is demand creation en air-cover; outcomes zijn de calibratiebron.

## Production readback
Eerste directe productie-run:
- 17.034 accounts verwerkt;
- 20 growth plays geregistreerd;
- 13 plays direct runtime-actief;
- 8 accounts boven de eerste Revenue Swarm activation threshold;
- 8 prebuilt prospect dossiers gematerialiseerd;
- 8 ranked play-events geschreven;
- 3 content recommendations aangeraakt;
- `powerhouse-growth-tools` ACTIVE v1;
- lost-knowledge endpoint HTTP 200 en expliciet `SCENARIO_ESTIMATE`.

Friction-index/workshop-output blijft leeg zolang de minimum dataset niet beschikbaar is. Er worden geen voorbeeldbenchmarks gefabriceerd.

## Truth & privacy
Publieke benchmarkgroepen hebben minimaal vijf waarnemingen. Private relaties en prospectnamen komen niet in publieke content. Economische waarde en M&A-risk blijven estimates totdat tenant/transactie-evidence beschikbaar is.


## Terminal closure
PR #3182 is protected merged to main at `ce0e18df0876a38be2ce6ce83964b2a274c9b150`. Production readback confirms 20 catalog plays, 13 runtime-active plays, 17.034 Growth Swarm accounts, 8 prebuilt dossiers and 8 ranked play-events today. The existing `powerhouse-commercial-learning-v1` remains the single scheduler owner; there are zero parallel Growth Swarm schedulers. The commercial cycle contains both Growth Swarm refresh and materialization. `powerhouse-growth-tools` is ACTIVE v4.
