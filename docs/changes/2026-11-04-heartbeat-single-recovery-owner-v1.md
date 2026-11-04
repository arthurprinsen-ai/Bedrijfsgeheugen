# Eén oorspronkelijke hersteluitvoerder — Heartbeat en Powerhouse

Datum 4 november 2026. Canoniek ONE BRAIN-incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 .

## Meting en oorzaak
De oorspronkelijke runtime-scheduler #171 draait iedere vijf minuten de `execution-resilience-watchdog` én `reconciliation-worker`; de nieuwe oorspronkelijke recovery-controller #184 roept exact die twee werkfuncties iedere vijftien minuten nóg eens aan. Hun buitenste transactielocks hebben verschillende namen; er bestaat daardoor geen overkoepelend bewijs dat zij exact één uitvoerder zijn. Cron-succes bewijst bovendien geen werkelijk extern herstel. De bronwaarheid telt 307 afgeronde reviews, waarvan 306 nog `UNRESOLVED`.

## Implementatie
De oorspronkelijke, afgeschermde `powerhouse_runtime_mux_task_v1` haalt bij de bestaande `terminal-autonomous-reconcile`-taak de echte JSONB-contractreceipt op en leest éénmaal `powerhouse_recovery_review_truth_v1()`. Het oorspronkelijke ONE BRAIN-foutpad en de overige taken blijven intact. `ok=true` blijft een uitvoeringsbewijs; `recovery_provider_resolution_proven=false` en `recovery_review_truth.outcome_state=EVIDENCE_DUE` houden de werkelijke provideruitkomst apart.

De migratie wijzigt uitsluitend de oorspronkelijke afgeschermde Heartbeat-functie. De officiële Supabase Git-preview gebruikt een beperkte migratierol die `cron.job` niet mag lezen; die rechten worden **niet** uitgebreid en er wordt in deze migratie **geen** cronjob uitgeschakeld. Dit voorkomt privilege-bypass en houdt de bestaande recovery actief tijdens de overgang.

**Fase 2:** na de beschermde merge, productiecode-readback én twee natuurlijke #171-uitvoeringen met `recovery_review_truth`, controleert de oorspronkelijke bevoegde database-eigenaar via de bestaande native verbinding exact de actieve #171-taak, de naam, planning en opdracht van #184 en de bestaande ACL. Alleen als al die controles slagen, wordt uitsluitend #184 via `cron.unschedule` opgeheven; daarna volgt onafhankelijke readback van de joblijst en de volgende natuurlijke #171-run. Anders blijft #184 intact en het incident OPEN. Beide fasen blijven aantoonbaar gelogd in ONE BRAIN.

## Experiment, analyse, leren
Hypothese: één originele writer zonder dubbel gepland herstelwerk verlaagt redundant werk en laat de onafhankelijke herstelverplichting beter zien. Baseline = twee bestaande geplande uitvoeringen, dezelfde watchdog/reconciliatiewerker en 306 open externe uitkomsten. Canary = native Supabase-preview met exact contract en rechten. Productiemeting = `cron.job` #171 actief, één originele herstel-worker-route, geen #184, twee natuurlijke `task_results` op #171 met gecorrigeerde `recovery_review_truth`, geen regressie in andere taaktypen, geen ongeautoriseerde externe replay. Klantwaarde pas bewezen als originele provider- of klantuitkomst zelfstandig is gemeten.

## Voorwaarden voor groen
Oorspronkelijke Heartbeat-eigenaar controleert writer-lease, actuele bron, beveiligde Required/BRAIN/CodeQL/native preview, beschermde merge en productieversie. Nooit handmatig een cronjob uitzetten om CI groen te maken. Alleen de specifieke **dubbele uitvoeringsfout** mag na onafhankelijke productiecontrole CAS-afgesloten worden; de 306 historische provider-onbekenden, overige blokkades en publicatiekanalen blijven open totdat hun eigen effecten aantoonbaar zijn.
