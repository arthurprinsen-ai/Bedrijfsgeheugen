# P0 14 november 2026 — Instagram + Gmail terugkoppeling in één originele Heartbeat

## Onafhankelijke productiemeting
Instagram 14 november: `PLANNED`, geen content-/provider-ID; originele ONE BRAIN CONTENT_HANDOFF `OPEN / OVERDUE_PUBLICATION`, oorspronkelijke Mira-mediataken **0** en bronlineage van de dag **0**. 12–13 november `FAILED / SILENT_PUBLICATION_FAILURE`; eigen cron `succeeded` is geen Meta-publicatie. Connected OpenArt `Plus` heeft op 14 november **0 beschikbare credits**: `canGenerate=true` op het project betekent niet dat betaalde generatie mogelijk is. Geen onbetaalde productiedekking, geen alternatieve media of gefingeerde Mira-gezichten. Bestaande Mira gezichtsgate ≥0,940 behouden.

Gmail: de bestaande connectorpreflight is OK; vandaag **0 nieuwe onafhankelijk bevestigde e-mails**. De oorspronkelijke `autonomous_email` is `waiting` met exact DataForSEO `NO_VERIFIED_SOURCE_RETRY` ACK en veilige heronderzoekdatum; er is geen toestemming om kwaliteit/recency/opt-outs te omzeilen. Beide LinkedIn-kanalen zijn vandaag wél `LIVE_PROVEN` met eigen provider-ID.

## Eén eigenaar, bestaande machine
Nieuwe PostgreSQL-migratie `20261114161000_original_daily_mira_email_heartbeat_handoff_v1.sql` wijzigt alleen de **bestaande** `public.powerhouse_commercial_intelligence_heartbeat_v1(date)`, reeds uitgevoerd binnen bestaande oorspronkelijke cron **#140**, naast bestaande originele #171 (Instagram/content consumer) en #116 (Gmail/content onderzoek). Geen extra cron, sender, Edge, mediagenerator, bronbudget, tabel of impersonatie.

Het bestaande dagelijkse `powerhouse_runtime_events.commercial_intelligence_heartbeat`-record plus hetzelfde functieantwoord krijgen `original_daily_mira_email_handoff` met originele Instagram source_revision, exacte ONE BRAIN consumer_ack en stage, providerbewijs, media-job/source-lineage aanwezigheid, Gmail `executed_at`-dag met provider-ID + readback, en werkelijk geregistreerde NO_SOURCE-research-consumer-ACK met due_at. Alleen deze brongebonden eigenaren kunnen weer een volgende actie doen. Het ontbreken van output blijft `OPEN_ORIGINAL_OWNERS_WAITING/OVERDUE`, niet artificieel groen.

De Media-capaciteit is een apart extern providerbudget. De **database alleen** mag OpenArt-creditstatus niet verzinnen; de agent/dagelijkse bestaande publisher moet de huidige accountscope echt lezen. De bestaande originele authorisatie voor production Supabase Edge blijft strikt: alleen Supabase GitHub Integration vanaf protected main; directe chatdeployment verboden. Native PostgreSQL-migratie via originele beschermde providerroute.

## Test en acceptatie
- Identieke oorspronkelijke cron/ONE BRAIN/Heartbeat lineage; ook originele SEO→CRO-receipt blijft behouden.
- Geen Meta/Composio/Gmail side-effects door de controle; geen nieuwe media of unsafe resend.
- Exact provider-ID, bronrevision en provider-readback voor publicatie/verzending; geen fake succes door HTTP 200, cron `succeeded`, bron-kandidaat of componentstatus.
- Required/CodeQL/native Supabase preview; beschermde merge; onafhankelijke werkelijke migration/function ACL en eerstvolgende natuurlijke oorspronkelijke #140 run.
- Echte Instagram-vandaag-live of e-mail-vandaag-verzonden blijft afzonderlijk **niet bewezen** totdat de oorspronkelijke providers zelfstandig teruggelezen zijn.

Incidents: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232.
