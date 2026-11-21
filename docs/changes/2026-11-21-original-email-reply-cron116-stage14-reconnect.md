# 21 november 2026 — originele Gmail-replyagent hervatten via bestaande commerciële scheduler #116

**Status:** SOURCE_CANDIDATE_NOT_LIVE, tot de beschermde Supabase-migratie daadwerkelijk op de originele productiedatabase is toegepast, de command van job #116 onafhankelijk is teruggelezen en een nieuwe echte function-readback is vastgesteld. Bronissue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/6098

## Reproduceerbare productiekloof
Op 21 nov onafhankelijk onderzocht in Supabase-project `adhjwmvyoixzjtmiroln`: `powerhouse-email-reply-loop` ACTIVE **v1216**, alle drie gedeployde bronbestanden identiek aan protected Git main na PR #6096. Desondanks registreerde `bg_gezondheid` voor exact deze owner de laatste run **20 oktober 2026 om 16:57 UTC**; vier historische `powerhouse_email_reply_events` (nieuwste 11 oktober), nul na recente release. De eenmalige bronrelease gaf dus geen bewijs van zelfstandige reply-ingest.

Tegelijk is de **enige canonieke commerciële scheduler** `cron.job` #116 `powerhouse-commercial-learning-v1` actief en draaide **336/336** keer succesvol over de 24u voor de audit. De scheduler's `public.powerhouse_commercial_hourly_stage_v1` voert veertien onafhankelijke fasen uit. Stage 14 draait op minuut **40 UTC**, maar roept alleen `powerhouse_commercial_learning_cycle_v1` aan (portfolio-/experimentleren, zonder Gmail-ontvangst). Geen andere productie SQL-functie bevat de exact benoemde Edge `powerhouse-email-reply-loop`; de historische aparte reply cron is bewust verwijderd. Daardoor geen bewezen periodieke inbox-verwerking, ondanks technisch gezonde scheduler en deployed code.

## Minimale reparatie in uitsluitend de oorspronkelijke runtime
- Nieuwe gecontroleerde migratie: `supabase/migrations/20261121090000_reconnect_original_email_reply_in_commercial_stage14.sql`.
- Dezelfde job #116 en exact dezelfde 14 vaste tijdslots, job owner en command blijven bestaan. Via `cron.alter_job(job_id=>116,command=>...)` wordt **uitsluitend** na bestaande stage14-aanroep één identieke geautoriseerde reply-input gedispatched.
- Hergebruik `public.bg_roep_functie('powerhouse-email-reply-loop', {...})`: de bestaande SECURITY DEFINER helper verkrijgt het bestaande token uit Vault en schrijft provider `pg_net` request-ID in `public.bg_functie_aanroep`. Geen tweede helper, nieuwe cron, commerciële afzender, Gmail-credential of duplicatie.
- Controleer exact de productieschema-jobnaam, bestaande stage-aanroep, het minutenrooster, geen parallelle reply cron, vaste providerdoelnaam, idempotente herhaling en veilige no-op als de geïsoleerde preview geen productie-cron bevat. Bij ontbreken van scheduler-token of SQL-fout gaat een getypeerde reparatie in bestaande `powerhouse_ops.enqueue`; geen fictieve klantrespons of herverzending.
- De originele Edge `powerhouse-email-reply-loop` blijft eigenaar van Gmail fetch, tekst/HTML quote-filter, classificeerbare reply, echte afmelding, exact-once reply-event, provider-link, outcome en Heartbeat-learning. Geen verandering aan de legale `email_marketing_permission`-grens van originele Gmail-sender.

## Voltooiingsnormen
1. GitHub **Required+CodeQL** + migratiegeschiedenis/checks op exacte HEAD, daarna protected merge.
2. Alleen de bestaande officiële database-migratieautoriteit past deze bron toe; geen SQL-edit uit chat direct op productie. `cron.job` #116 moet onafhankelijk teruglezen dat stage14 de replyfunctie aanroept, met dezelfde job-id, `active=true` en oorspronkelijke cron-expressie.
3. Op een **werkelijke volgende originele stage14** moet een nieuw request-id voor `powerhouse-email-reply-loop` in `bg_functie_aanroep` voorkomen en een echte `net._http_response` HTTP2xx verifieerbaar zijn, gevolgd door een verse rij voor `bg_gezondheid.onderdeel='powerhouse-email-reply-loop'`. Als 0 eligible Gmail replies bestaat, vermeld `eligible=0` en `ingested=0`; geen foutief commercieel groen.
4. Alleen daadwerkelijke nieuwe Gmail replies met eigen provider message-ID en downstream response/outcome-ACK mogen commerciële effectclaim dragen. Een "goede" PR, job-success, net.http_post-ACK of gezondheidsstatus bewijst geen positieve reply of omzet.

**Bronrichtlijnen**: https://supabase.com/docs/guides/cron/quickstart en https://supabase.com/docs/guides/functions/schedule-functions.

**Privacy/aantallen bij audit**: 23.284 eerstegraads LinkedIn-connecties, 605 met email, 123 interne autorisaties, **nul** afzonderlijk aantoonbare `email_marketing_permission` records. Geen bulkmail, opt-in-fictie, herhaalde salesmails of opheffen van bestaande suppressies.
