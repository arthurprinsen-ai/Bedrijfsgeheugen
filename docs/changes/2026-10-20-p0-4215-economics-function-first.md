# P0 #4215 — economics functie vóór index-DDL

20 oktober 2026. De protected merged [#4540](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4540) bevat de correcte begrensde economics reconciler, maar de gecombineerde productiemigratie faalde op PostgreSQL 57014. Hierdoor is de oude onbegrensde functie nog actief. 

Deze gerichte herstelfase hergebruikt **exact** de in #4540 gereviewde functiebody en server-only privileges, maar scheidt die van de indexaanmaak. De guard eist alle originele kernankers, een transactielockbudget van 2s en statementlimiet 12s. Geen nieuwe cron, geen verwijdering, geen provider-kostclaim; maximaal 50 historische eligible acties per bestaande run, rest wordt op volgende runs opgepakt. Het indexdeel blijft onderdeel van #4540 en moet bij aantoonbare DB-stabiliteit veilig worden uitgerold.

Acceptatie: Required test + CodeQL + native Supabase Preview, protected merge, productie apply/readback van `pg_get_functiondef`, ACLs, achterstand en echte runs, en pas daarna signed portaal HTTP 200 met twee geïsoleerde klanttenants. Niet als LIVE_PROVEN presenteren zonder deze bewijzen.
