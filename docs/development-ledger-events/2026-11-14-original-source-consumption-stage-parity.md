# 2026-11-14 — Source-consumption assurance herstelt oorspronkelijke stage-authority

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Waargenomen fout
Productiecontrole `powerhouse_source_consumption_assurance_v1()` rapporteerde `healthy=false`, ondanks 23.295/23.295 op 14 november verrijkte connecties en actieve originele commerciële cron #116 en runtime mux #171. De checker controleerde nog de bewust uitgefaseerde jobs `powerhouse-commercial-context-daily-v1` en `powerhouse-commercial-actions-daily-v1`. Dit is een valse negatieve scheduler-topologiecheck, niet automatisch bewezen verloren data.

## Bestaande bronbevestiging
Originele #116 registreert elke stage als `powerhouse_runtime_events` met eventtype `commercial_stage_execution`, `context.canonical_job_id=116`, `evidence.reported_degraded` en het originele stage-ID. De live read-only SQL-probe op 14 november liet unieke recente receipts zien voor `powerhouse_refresh_relationship_revenue_v1`, `powerhouse_execute_growth_play_actions_v1` en `powerhouse_commercial_learning_cycle_v1`, met beide schedulers actief en nul actieve gesplitste legacyjobs.

## Gerichte correctie
Alleen de bestaande bronconsumptie-readfunctie gebruiken voor actuele #116/#171 authority én drie echte succesvolle originele stages in een 26u-window. Behoud bestaande payload-sleutels en maak de status expliciet `ORIGINAL_SOURCE_TO_EXECUTOR_RECEIPT_ONLY`. Externe provider-delivery, consumer-ACK, omzet en volgende leeractie blijven `NOT_ASSESSED_BY_THIS_READ_MODEL`. Geen tweede cron, publisher, agent of wachtrij. De oorspronkelijke `brain_obligations` en gesloten-luscontroller blijven leidend.

## Uitvoering en bewijsgrenzen
Deze candidate is een beschermd GitHub-wijzigingsvoorstel; geen databasewijziging, provider-publicatie, omzet of live readback op basis van alleen deze source change. Vereist: Required/CodeQL en backendchecks op exacte PR-head, protected merge, geslaagde bestaande migratieroute met provider-migratie-ID, SQL-readback van echte oorspronkelijke stages en natuurlijke volgende run. Source green betekent niet dat zeven rode lussen of open handoffs gesloten zijn. Verwerk elke nieuwe fout onder hetzelfde originele fingerprint en update originele agent/skill.
