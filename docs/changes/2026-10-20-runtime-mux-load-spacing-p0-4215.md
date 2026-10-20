# P0 #4215 — bestaande scheduler gecontroleerd ontlasten

Datum: 2026-10-20. Canonieke P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215 en commercieel https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Feitelijk bewijs en hypothese
In productie bleven om 10:34 UTC PostgreSQL statement timeouts, connection resets en pg_cron job 171 startup timeouts bestaan. pg_stat_statements toont hoge cumulatieve belasting: revenue snapshot gemiddeld 88,1 s (618 calls), contact authority review gemiddeld 7,46 s (1878 calls), scheduler mux gemiddeld 3,02 s (5877 calls), commerciële Heartbeat gemiddeld 2,89 s (3659 calls). Die gemiddelden zijn geen recente p95 en bewijzen op zichzelf geen causale keten.

Job 171 had bij de vastgestelde directe productie-readback de bestaande schedule `1-59/5,3-59/5,4-59/5 * * * *`: 36 connection start attempts per uur. De migratie beperkt dit tot `1-59/5,3-59/5 * * * *`, 24 attempts per uur, zonder de job, uitvoering of scheduler uit te schakelen. De bestaande command/owner/active-attributen blijven gelijk. Wijziging uitsluitend indien oorspronkelijke scheduler-identity, actieve state en exacte originele schedule nog overeenkomen; anders faalt de migratie.

## Validatie en rollout
1. Branch-/scope-acceptatie, Required CI en CodeQL en toepasselijke Supabase Preview. Preview zonder cron.job of job 171 bewijst alleen migratieparsing en regressie, niet gedrag in productie.
2. Beschermde merge; pas daarna productie via bestaande geautoriseerde migratieroute en bevestigde `cron.job` readback op job 171 (actief, 24/uur, command/owner ongewijzigd).
3. Vergelijk live job 171, 116, 130, 138: starttimeouts per uur, task-result evidence, achterstand/catch-up, contactbeoordeling, commerciële Heartbeat, echte provider-publicaties en verzonden e-mails. Als scheduler SLA of backlog verslechtert, **herstel exact de vorige schedule met `SELECT cron.alter_job(171, schedule => '1-59/5,3-59/5,4-59/5 * * * *');`** langs de geautoriseerde route.
4. Hercontroleer productie-DLL van de al gemergede portal indexmigratie #4537 na stabilisatie; voer deze niet blind opnieuw uit terwijl de pool vastloopt.
5. Pas na aparte post-change performance-/tenant-/providerbevestiging #4215 en #4198 evalueren; **geen LIVE_PROVEN door CI of migratie alleen**.

Niet in scope: vertraging kunstmatig oprekken, cron uitschakelen, tweede scheduler/outreachkanaal, permissies, klantdata of RLS wijzigen. Bij ontbrekende productiejob geen cron aanmaken.
