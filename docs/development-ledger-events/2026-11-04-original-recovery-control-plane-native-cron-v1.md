# 4 november 2026 — oorspronkelijke herstel-control-plane ontbreekt als autonome cronjob

## Productiebewijs en oorzaak
De originele `public.powerhouse_recovery_control_plane_tick_v1()` bestaat. Eén eenmalige gecontroleerde bronuitvoering op 06:41:12Z was `COMPLETED`, `elapsed_ms=12`, `watchdog_rows=0`, `reconciliation_rows=0`. De originele `public.powerhouse_recovery_review_truth_v1()` registreert 307 afgehandelde triagereviews, maar **306 onderliggende uitkomsten zijn expliciet UNRESOLVED**. Productie bevat op dezelfde tijd **nul actieve pg_cron-jobs** voor deze oorspronkelijke tick. De functie draait dus niet zelfstandig op een betrouwbaar ritme.

## Herstel in één bestaande architectuur
Registreer de **bestaande oorspronkelijke** `powerhouse_recovery_control_plane_tick_v1()` via de **reeds aanwezige** Supabase `pg_cron` (versie 1.6.4) onder één unieke taaknaam, iedere vijftien minuten. Deze migratie creëert géén aparte worker, scheduler-service, HTTP-publisher of tweede inhoudelijke auteur. De bestaande tick houdt zijn `pg_try_advisory_xact_lock` en originele watchdog/reconciler. Bij bestaande dubbele of conflicterende originele uitvoerders faalt de registratie expliciet, zonder jobs uit te schakelen.

## Definitieve afronding
De code moet door beschermde GitHub-tests, CodeQL en Supabase Preview. Daarna origineel mergecommit, migratiehistorie, **exact één** actieve native job, een echte natuurlijke `cron.job_run_details`-run en onafhankelijke `powerhouse_recovery_review_truth_v1()` teruglezing. Review of cron-succes maakt een productie-incident niet opgelost; 306 onopgeloste provideruitkomsten blijven open totdat iedere eigen bron de echte herstelactie bewijst. Geen massaal groen, statusmanipulatie of onbekende side-effect replay. De dagelijkse content-job #140 blijft ongemoeid.

Incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Oorspronkelijk ontwikkellog
- 2026-11-04T06:41Z geverifieerde broncontrole: no active original recovery tick job, original function works, outcome proof EVIDENCE_DUE.
- Eigenaar: oorspronkelijke ONE BRAIN/Powerhouse recovery-control-plane.
- Aansluiting: dezelfde bestaande pg_cron extension, één geautoriseerde job met collision-gate.
- Regressie: tests/brain-original-recovery-control-plane-native-pgcron-20261104.test.mjs.
- Verifieer natural run en provideruitkomst apart.
