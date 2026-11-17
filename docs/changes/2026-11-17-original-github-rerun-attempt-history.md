# 17 november 2026 — Eerdere mislukte GitHub-pogingen bewaren na een geslaagde herstart

Originele eigenaar: **Repository Janitor** binnen de bestaande Powerhouse/ONE BRAIN-keten. P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Geobserveerd incident

Een exacte native GitHub Actions Required-run met run-ID **44061313845** faalde op poging 1 (Provider `GET /actions/runs/44061313845/attempts/1`: `status=completed`, `conclusion=failure`, HEAD `0fbfa55f9b94ae5993d8307b761c16ce140cbf83`). Dezelfde workflow heeft poging 2 later op `conclusion=success`. De bestaande Janitor leest `GET /actions/runs?status=completed`, waarin de laatste poging van die run wordt geprojecteerd. Daarmee zou deze echte eerdere fout ongemeld kunnen blijven. Een succesvolle herstart herstelt de CI-uitvoering, maar wist niet het incident of de les. Dit is een **afzonderlijke bronoorzaak** naast de reeds beschermde per-venster checkpoint-fix #5946.

## Concreet herstel, zonder parallelle uitvoerder

In `tools/delivery/github-actions-failure-observer.mjs` blijft de twaalfmaal vier-uurs source scan actief onder dezelfde originele uurlijkse Repository Janitor. Voor iedere volledig gelezen run met `run_attempt > 1` worden de afzonderlijke eerdere GitHub-pogingen exact opgevraagd via `GET /actions/runs/{run_id}/attempts/{attempt_number}` en gecontroleerd op overeenkomstige run-id, workflow-id, commit, event, pogingnummer en voltooiing. Mislukte oudere pogingen gaan via dezelfde `classifyActionsRun`, bronhash, `public.brain_observe_failure`, idempotency en `brain_failure_occurrences` readback als moderne fouten. Een historische match met hetzelfde bewijs wordt niet nogmaals gecreëerd. Geen foutklasse wordt uit de achteraf succesvolle hoofdregel afgeleid.

De aanvullende bronverificatie is begrensd: maximaal 51 totale pogingen per run, maximaal 100 oude-pogingqueries per vieruursvenster. Als meer historie of een providerbron ontbreekt, blijft het afgedekte venster **ONVERIFIED** met exact partial checkpoint; eerdere succesvol vastgelegde vensters gaan niet verloren. Maximaal één oorspronkelijk source observer, geen extra provider sender of cron. Het ongeteste nieuwe script alleen bewijst nog geen werking.

Regressies in `tests/brain-github-actions-rerun-attempt-history-20261117.test.mjs`: succes na fout, twee verschillende historische foutsoorten, foutieve workflow-identiteit, falend providerendpoint na eerder correct window, bounded source budget en behoud originele workflow. Inherited tests `tests/brain-github-actions-observer-durable-window-20261117.test.mjs` en `tests/brain-github-actions-failure-observer-20261104.test.mjs` blijven verplicht. De bestaande agent-skill `.agents/skills/powerhouse-delivery-concurrency/SKILL.md` bevat voortaan deze regel.

## Voltooiingscriterium

Eerst exact protected PR Required/CodeQL en onafhankelijke merge op main, daarna de volgende **natuurlijke** oorspronkelijke Janitor-run, en exacte nieuwe `brain_failure_occurrences` readback van een oude provider-run/poging die door nieuwe source heeft gelopen. Repeated natural run moet dezelfde event/hash dedupliceren. Extra incident/failure classes blijven origineel OPEN met eigenaar, onderzoek en regressietest. CI, PR of een bruikbare bronquery op zich zijn geen `LIVE_BEWEZEN` voor het hele Powerhouse.

Bronnen:
- https://docs.github.com/en/rest/actions/workflow-runs
- https://docs.github.com/en/rest/actions/workflow-jobs
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44061313845
