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
