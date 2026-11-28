# Snapshot-cron: statement_timeout vóór het DO-statement — 2026-11-08

## Problem
De uurlijkse cronjob `powerhouse-revenue-intelligence-snapshot-15m` (job 46) zet `statement_timeout` met `set_config` binnen het DO-blok. Dat herstart de timer van het lopende statement niet, dus de werkelijke grens bleef 120 s. In 14 dagen: 336 runs, 4 mislukt (1,2%), geslaagde runs gemiddeld 59,6 s en maximaal 114,3 s.

## Change
- `supabase/migrations/20261108130000_snapshot_cron_statement_timeout_v1.sql`: alleen de cronopdracht van die job; `set local statement_timeout = '240s'` als eigen statement vóór het DO-blok. Advisory lock, beide functies, ACL en schema onaangeroerd. No-op zonder `cron.job` of zonder die job.
- `tests/brain-snapshot-cron-timeout-20261108.test.mjs`: pint de vorm van de opdracht.

## Evidence
`cron.job_run_details` van 25 okt tot 8 nov.

## Known limit
Maakt de job niet sneller en bewijst niet dat de werkelijke grens nu 240 s is; dat blijkt pas uit de eerstvolgende runs na toepassing. Structurele oplossing vraagt tenantpariteit en performancevalidatie.
