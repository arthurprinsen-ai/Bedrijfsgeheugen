# Development ledger — portal EU database fan-out

Datum: 2026-10-15  
Obligation-ID: powerhouse-portal-eu-bounded-read-fanout-20261015-v1  
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4410

## Root cause bewijs
De geauthenticeerde productiecheck op merged SHA 7c34bb0 retourneerde herhaaldelijk API HTTP 504. Supabase-logvenster 16:08–16:13 UTC bevatte `canceling statement due to statement timeout` en `cron job startup timeout`. Job 171 had in het beoordeelde 2-uursvenster 24 runs, 5 mislukkingen en een maximumlooptijd ~722 sec. Exacte causale queryidentiteit is niet bewezen. De portaalgateway had wel aantoonbaar tien parallel gestart PostgREST-queries, een beheersbare amplification factor.

## Wijziging
Begrens concurrentie tot drie per batch met lazy query-start en behoud fail-closed foutafhandeling. Geen Cron-uitzetting, geen bypass van de portaal-authenticatie, geen ontbrekende records als klantfeiten.

## Acceptatiegrens
Source PR, tests en CodeQL, beschermde merge, Edge-uitrol, echte Netlify/auth readback. Zonder deze laatste signalen geen productieclaim.

## Protected-current-main recovery (2026-10-15)

Candidate was replayed strictly over current main `c40bddc1018b7923f2c10371c4191547b28a5ea4`, preserving exactly the six original changed paths. Earlier Required/CodeQL/Supabase checks on the prior head are not sufficient; the new exact head must pass again. No database changes or live publication claimed by this branch refresh.
