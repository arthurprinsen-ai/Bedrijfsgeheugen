# Groen-draaiboek: betekenis van de brein-status-alarmen — 2026-11-08

## Problem
`brein-status|pg_cron|FOUT` (1.371 voorkomens) en zes andere grote brein-status-patronen hadden geen vastgelegde oorzaak. Een eerste hypothese dat `growth-datahub-ingest` het niet-werkende onderdeel was, bleek onjuist.

## Change
- `docs/brain/groen-draaiboek.md`: sectie 7 met wat elk groot alarm betekent en de leesregel.
- `tests/brain-groen-draaiboek-20261108.test.mjs`: toetst dat sectie 7 bestaat.

## Evidence
Supabase op 2026-11-08: zelfbewaking 17 gecontroleerd, 1 niet werkend; `cron.job_run_details` van 31 oktober tot 8 november.

## Known limit
Momentopname. De fix voor de snapshot-timeout staat niet op main.
