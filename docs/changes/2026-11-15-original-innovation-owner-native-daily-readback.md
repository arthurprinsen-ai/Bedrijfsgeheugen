# Oorspronkelijke innovatie-opdrachten dagelijks rechtstreeks uitlezen — zonder valse agent-ACK

**Datum:** 15 november 2026  
**Bestaand incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Canonieke runtime:** Supabase-project `adhjwmvyoixzjtmiroln`, dagelijkse pg_cron `#107`, bestaande GitHub `.github/workflows/powerhouse-daily-self-evolution.yml`.

## Geobserveerde uitvoeringskloof

Oorspronkelijk `powerhouse_run_self_improvement_layer_v1(date)` is operationeel en registreert de 14 relevante `powerhouse_optimization_candidate_v1`-records in 14 `INNOVATION_DELIVERY`-verplichtingen en 14 idempotente `INNOVATION_INTAKE`-operaties. Productie op 15 november 09:02 UTC: 14 `PLANNED`, nul oorspronkelijk zelfstandig gecontroleerde agent-ACK's. Dertien zijn toegewezen aan `agent:agent-integration-engineer`, één aan `agent:agent-growth-market`. Oorspronkelijke 52/107/171 crons zijn actief, maar een planning is geen uitvoering. De bestaande GitHub Daily Self Evolution test tot dusver vooral statische agentskills en de **READ_ONLY_CONTRACT_AND_BACKLOG_PROJECTION**; die taak is geen echte bron-gebonden opname van de 14 originele operaties.

## Kleinste oorspronkelijke reparatie: één bestaande workflow, géén nieuwe uitvoerder

De bestaande GitHub-workflow leest nu in een `if: always()` stap na de eigen verbeteringstaken alle drie de bestaande autoriteitsbronnen met één canonieke server-side Supabase-secretconfiguratie. `scripts/brain/innovation-original-owner-readback.mjs` volgt expliciete `Prefer: count=exact` en echte `Content-Range` per pagina (tot een veilige maximumgrens), en weigert stille truncatie, duplicatie, identiteitswissel of aantallen die tijdens het lezen verschuiven.

Voor elk origineel bronrecord moeten kandidaat-ID, originele bronrevisie, source_key, agent-eigenaar, obligation SHA256, operation correlation-id, idempotency-key en original operation-id aantoonbaar overeenkomen. Iedere `VERIFIED`-claim vereist ook een echte `remote_ref`, exact dezelfde `consumer_owner`, dezelfde `source_revision` en `independent_consumer_readback=true`. Zonder dat wordt de broncontrole zelf rood in plaats van toch een ontvanger of bewezen innovatie te verzinnen.

De read-only controle verwerkt de brongebonden operation-ID's uitsluitend in beschermd runnergeheugen; het artifact **redigeert alle kandidaat-ID's, source keys, revisies, operation-ID's en detailtaken**, omdat een GitHub Actions-artifact in een publieke repository openbaar leesbaar kan zijn. Het bevat alleen status, totalen en oorspronkelijke agentverdeling.

De read-only controle maakt een audit-artifact onder het **bestaande** `artifacts/quality/`, dat door dezelfde bestaande GitHub-upload wordt bewaard. Hij creëert géén queue, scheduler, database, provideractie, agentworker, klantcontact, extra modeluitvoerder of autonoom deploypad. Alle overige dagelijkse stappen blijven bij een fout doorgaan; een ontbrekende of onvolledige bron is expliciet `SOURCE_UNAVAILABLE` en een echte open intake `OWNER_ACK_PENDING`. Ook nadat 14 consumer-ACK's later onafhankelijk zijn vastgesteld, blijft echte bedrijfsimpact `INNOVATION_OUTCOME_UNVERIFIED` tot de daaropvolgende Heartbeat/ONE BRAIN-effectmeting.

## Gerichte negatieve regressie en veiligheid

`tests/brain-innovation-original-owner-readback-20261115.test.mjs` oefent de echte read-only functie uit op meer dan één providerpagina, ook als de provider een kleinere pagina terugstuurt; ontbrekende Content-Range, wisselende totaaltelling, onbekende eigenaar, originele-bron mismatch, vervalste `VERIFIED`, geen kandidaten, en main-only autorisatie. De test eist uitsluitend GET, geen side-effects en exact één bestaande dagelijkse schedule. De standaard `.agents/skills/powerhouse-self-improvement-layer/SKILL.md` registreert de preventieregel.

## Niet automatisch afgerond

Deze code is een **echt origineel brongebonden controle-instrument**, geen autonome engineer/CRO-uitvoerder. Ze verhelpt de oorzaak van stille onzichtbaarheid bij de GitHub-daglus, **niet** de nog ontbrekende 14 agentconsumpties, source-bound uitgevoerde PR's, benodigde review, onafhankelijke provider-readback of meetbare impact. De originele PR-governance met Required, CodeQL, full BRAIN, protected merge, Netlify/production/skill readback en de oorspronkelijke eigenaar blijven leidend. Het oorspronkelijke P0-incident blijft open totdat de eigenlijke opdrachten zijn uitgevoerd.

**Accepteren als live:** uitsluitend na protected Required+CodeQL, echte full-BRAIN, merge, en de eerstvolgende natuurlijke bestaande Daily Self Evolution providerreadback met geldig exact-count artifact en niet-valse status. Een goedgekeurde broncommit alléén mag niet als dagelijkse providerverificatie worden gerapporteerd.

