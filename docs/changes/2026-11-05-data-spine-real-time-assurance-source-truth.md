# 2026-11-05 — bron draait, Heartbeat vergeet tussenliggende bewijsmomenten

Originele parent: [ONE BRAIN autonomie #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Geen tweede scheduler, agent, bedrijfsoverzicht of truth store.

## Onafhankelijk vastgesteld in originele Supabase

De oorspronkelijke `public.powerhouse_runtime_scheduler_mux_v1` start `public.powerhouse_data_spine_watchdog_v1(now())` bij `m % 10 = 1` (elke tien minuten). Deze controle schrijft actuele bronobservaties en echte `source_health_evaluated`-events, waaronder vandaag data van GA4, Search Console, externe intelligentie en portaal. De source health heeft nul ongezonde bronnen. Het aanvullende oorspronkelijke `powerhouse_refresh_regression_stage_evidence_v1` schrijft daarentegen alleen bij `:23` en `:53` een `guard`, `action`, `outcome` en `learning`-stage. De bestaande assurance-registratie eist tienminutenbewijs (vers bij maximaal 20 min); gemeten op 5 november 13:18 UTC waren action/guard/outcome/learning ongeveer **25 minuten oud**, terwijl input en source-readback ongeveer **4–7 minuten** oud waren. De oorspronkelijke Heartbeat rapporteerde daarom terecht AMBER wegens ontbrekende verse stages, maar kon die broncheck niet zelf herstellen.

## Gerichte correctie in bestaande eigenaar

De nieuwe, beschermde migratie `20261105132000_original_data_spine_same_tick_stage_receipts_v1` past **alleen de bestaande** `public.powerhouse_data_spine_watchdog_v1` aan. Die bewaart dezelfde echte bronreconciliatie en schrijft na succesvolle uitvoering de vier genoemde bronbewijsstages op dezelfde oorspronkelijke `p_now` via dezelfde `public.powerhouse_record_loop_stage_v1`. Een werkelijke `unhealthy_sources > 0` houdt guard=false, action=REPAIR_REQUIRED; nul ongunstige bronnen levert een bewijsbaar `VERIFIED_NO_OP`, niet een verzonnen omzet- of CRO-resultaat. De metadata vermeldt expliciet `customer_outcome_verified=false` en `causal_learning_verified=false`. De oudere onafhankelijke bronbrug blijft bestaan als kruistoets; er is geen tweede uitvoerder of cron, geen nieuwe databaseautoriteit en geen versoepeling van de service-role-beperking.

## First time right en echte afsluiting

SQL-migratie + exact dezelfde `supabase/migration-history.lock.json` bevat rij 807; `tests/brain-data-spine-original-ten-minute-stage-proof-20261105.test.mjs` controleert uitvoeringsvolgorde, agentcontract, echte guardwaarde, migratiehistorie en privileges. Na beschermd groen en merge moeten oorspronkelijk Supabase productie `pg_get_functiondef`, originele volgende mux (m % 10 = 1), exacte stage-observed_at, de bijbehorende oorspronkelijke assurance-status en ONE BRAIN-verplichting onafhankelijk worden teruggelezen. Niet sluiten bij foutieve data, en deze oplossing mag **niet** worden geteld als een opgeloste blokkade voor social/Instagram, 3477 forecasting gaps of echte betaalde omzet.
