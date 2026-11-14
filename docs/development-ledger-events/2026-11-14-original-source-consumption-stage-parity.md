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


## Supersession proof — original P0 maintained

- Earlier PR #5786 remains historical closed SUPERSEDED due PREVIEW_BRANCH_UNASSOCIATED and source migration version lower than native last applied 20261114184600, never bypassed.
- Protected PR #5791 actually merged, original GitHub main source lock and Supabase production each 859/859 identities.
- Single successor on latest main carries identical SQL function semantics with **new proposed** supabase/migrations/20261114194000_original_source_consumption_stage_receipt_parity_v1.sql, original agents/skill, same one BRAIN machine evidence and regression; old PR stays closed, one active delivery candidate.
- New protected PR Required, CodeQL, native Supabase Preview; no SQL as applied until provider independent receipt. If branch baseline preview fails, inspect, rebase ONLY the same nonproduction preview branch, rerun failed canonical jobs after true provider success, no fake check.

## Protected source resynchronization after native 860 — no lost innovation changes

The original #5794 head was never merged. Supabase Preview was cancelled by the platform's active-branch cap, and the already-existing ONE BRAIN failure fingerprint was updated with the exact provider check. After #5793 protected merged, both the original innovation-agent changes and our original source-consumption changes touched `platform/agents/agent-team.mjs`. GitHub correctly rejected a source merge conflict; no force-push or overwrite was attempted.

Protected lock-only #5795 then merged, with independently verified 860 native provider/860 GitHub source-lock identities. This one next successor from that **current main** adds only the two source-to-stage tasks into the latest innovation-capable agent-team file, imports the original source-universe skill section without wiping other skill content, carries the same read-model source and regression under proposed migration `20261114194000` (still > native `20261114193000`), and keeps every original P0 #4198 obligation OPEN until provider, consumer, measured outcome and next natural learning proof. PR #5794 was closed SUPERSEDED not FULFILLED. There is one active candidate, not multiple schedulers.
