# Media-migratie correctie — 10 oktober 2026

## Oorzaak
Na beveiligde merge van PR #4312 werd de productie-DDL geweigerd: `42601 syntax error at or near REVOKE`. De uit Postgres geëxporteerde functiedefinitie miste na `$function$` de SQL-terminator `;`, direct vóór de expliciete rolbeveiliging.

## Correctie
Precies één SQL-terminator toegevoegd. De eerdere functie-inhoud, rolbeperkingen, verificatievoorwaarden voor exacte Mira-video en bestaande publicatie-authoriteit zijn ongewijzigd. De migratie blijft `SECURITY DEFINER` en trekt `EXECUTE` van `PUBLIC`, `anon` en `authenticated` in; alleen `service_role` wordt toegelaten.

## Validatie
Beschermde verplichte CI; de bestaande SQL-migratie volledig toepassen; effectieve privileges readback; pre/post Media-job manifest vergelijken na `powerhouse_ensure_instagram_media_job_v1`; Edge parity en canonieke dagloop. Instagram niet als live melden zonder exacte beeld- en identiteitcontrole plus echte provider-ID.
