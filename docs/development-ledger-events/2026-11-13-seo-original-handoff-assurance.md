# Development ledger — 2026-11-13 — P0 #4198 SEO één keten

- **Fingerprint:** `seo|one-chain|original-handoff-assurance|20261113-v1`
- **Root cause:** Guard in oorspronkelijke `powerhouse_refresh_seo_assurance_v1` had `v_pass = v_recs>0 OR v_forecasts>0` en noemde de SEO-loop GREEN zonder bewijs van doorgeleverde echte conversie en next-run learning.
- **Productie-observatie:** 13 november 2026: originele SEO-loop `GREEN`, bronverplichtingen 11/12/13 november `OPEN`; originele exacte source-to-consumer ACK wel aanwezig, `optimization_status=NOT_EXECUTED`, `actual_cro_experiment_executed=false`, `causal_lift_or_revenue_proven=false`. 33 keyworditems `canonical` op 9 november; 7 broken/unproven commerciële handoffs in de 7d-scorecard.
- **Original owner:** `powerhouse-seo-opportunity-resolver`, originele #175 → ONE BRAIN/Heartbeat #140 en bestaande BG169 website writer. Geen tweede writer of scheduler.
- **Wijziging:** bestaande functie behoudt signatuur/ACL/schema, kijkt naar exact origineel Brain obligation/tenant/dag/bronrevisie/ACK, origineel provider- en releasebewijs, eventgebonden meting, causale of betaalde uitkomst en volgende natuurlijke learning-run. Ontbrekende velden worden `false`, geen impliciete DONE.
- **Regressie:** `tests/brain-seo-original-handoff-assurance-20261113.test.mjs`. Test ACK-only, lege bron, metadata, vereiste onafhankelijke provider-readback, oude false-green en duplicate-scheduler-verbod.
- **Deployment gate:** beveiligde PR #5748, Required/BRAIN/CodeQL/preview, protected merge, echte Supabase migratieregistratie, functie-readback, oorspronkelijke cron en Heartbeat/portal status. Geen direct SQL op productie of bypass.
- **Onopgelost:** echte CRO-actie, valid A/B-experiment, gemeten incrementality, lead/order/paid-receipt en volgende-run leren. De wijziging maakt ze zichtbaar en afdwingbaar in assurance; zij produceert die resultaten niet zelf.
- **Preventie:** statuspaspoort per stage met originele `obligation_id`, bronrev, ACK, onafhankelijke productie, meetevents, outcome en next-run-verificatie.
- **Bron:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## 2026-11-13 17:03 UTC — productiebeleid daadwerkelijk afgedwongen

- Beveiligde hoofdmerge: `6e435bdcffc343b1fd834d3d5a65abfeedb67e31` (#5748), Required #43467928347 SUCCESS inclusief `supabase_preview`, CodeQL #43467927648 SUCCESS.
- Supabase eigen productie: migratie `20261113164000` aanwezig; originele functiebody gelezen en dezelfde functie opnieuw aangeroepen, resultaat `WAIT_PRODUCTION_ACTION`, `guard.pass=false`.
- Exacte oorspronkelijke bron- en consumer-SHA zijn gelijk (`937fd65725813cf0320465b5a92231d86f0faf5327bdd128057e2b6c16baacfb`); bronverplichting `40b62d82-dcd3-4a44-98d0-3f94071008a9` is terecht OPEN.
- Zes bestaande stage receipts action/readback/measurement/outcome/learning/guard `pass=false`, met originele obligation-ID; bestaande BRAIN OPERATIONS_ASSURANCE = OPEN en `seo-opportunity-resolver = RED` (7 GREEN/8 RED totaal), na originele assurance-refresh om 17:03 UTC.
- Nog niet bewezen: oorspronkelijke productieactie, causale CRO-experimentmeting, order/betaalbewijs en aantoonbare next-run-leertoepassing. Geen nieuwe scheduler, verzender of bronduplicatie.

## 2026-11-13 17:08 UTC — onverwachte CI-gate, zelfde oorspronkelijke provider-lock

- Eerste PR #5750 Required faalde in preflight op zes bestaande migratie-integriteitsasserties: Git executable manifest 849 vs originele onveranderlijke source lock 848. Geen test- of securitybypass.
- Direct native Supabase production list_migrations: exact 849 daadwerkelijk toegepaste version/name-identiteiten. Alle 848 bestaande locked entries gecontroleerd tegen de eerste 848 provider-records: **0 verschillen**. Provider #849 exact `20261113164000/original_seo_one_chain_outcome_assurance_v2`, checked 17:08:05.767534Z.
- Append alleen die 849e native provideridentiteit aan bestaande `supabase/migration-history.lock.json` en voeg regressie `tests/brain-original-provider-849-migration-lock-20261113.test.mjs` toe; alle 848 originele identiteiten ongemoeid. Beveiligde protected CI en merge blijven verplicht; inhoudelijke websiteactie/effect/omzet/leren blijven OPEN.
