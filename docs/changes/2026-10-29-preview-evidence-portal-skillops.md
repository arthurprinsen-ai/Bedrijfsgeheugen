# Powerhouse portal: onafhankelijke lus- en terminale bewijsketen (29 oktober 2026)

De bestaande Powerhouse Control Plane toont al Intelligentielagen, Heartbeat, Growth en CRO, maar miste de echte volledige 15-lussenintegriteit en de terminale controlplane-health. Daardoor leek een verbinding 32/32 en 18/18 mogelijk op zichzelf groen, terwijl runtime 2 fouten, content BLOCKED, loop RED en twee RESULT_UNKNOWN-reconciliaties open waren.

## Correctie in bestaande architectuur
Dit verandert alleen de bestaande read-only, beheerdergeautoriseerde route `/api/powerhouse-control-plane`. De huidige server leest via zijn bestaande vertrouwelijke Supabase REST-servicekey nu ook twee originele public views: `powerhouse_loop_integrity_health_v1` en `powerhouse_terminal_control_plane_health_v1`. De bestaande Portal V2 cockpit toont aantallen groen/oranje/rood, blokkades en geëscaleerde onbekende resultaten. Niet gelezen bronnen worden `PARTIAL` en `GEEN BRON`, nooit groen. Er wordt geen nieuwe datastore, endpoint, cron, publisher of extra portaal gebouwd.

## Herhaling vermijden
Een echte Supabase Preview SQLSTATE 23505 op reeds toegepaste migratie is geen succesvolle run. De oorspronkelijke migratieherstel-PR #5146 is eigenaar van exact 784 Git/production migratie-identiteiten, onder Required/BRAIN/CodeQL. Een aparte Supabase preview-database die 779 versies bevat en al aanwezige oude versies dubbel invoegt moet door de officiële provider-owner worden gereconcilieerd, zonder handmatig history-DML/reset/betaalde tweede branch of verzwakte gates.

## Verificatievolgorde
Test de twee huidige bronnen in Supabase en voer de nieuwe Brain-regressie/test uit; require exact-head Required, CodeQL, beschermd merge, Netlify deploy exact commit, geauthenticeerde beheerderbrowser ziet RED en ontbrekende bron als PARTIAL, onbevoegde tenant krijgt 401/403. Meld runtime-/business- of skill-adoptie pas groen na een echte natuurlijke run en onafhankelijke klant-/provider-readback. Portaalprojectie is **geen** automatische belofte dat alle agents de gewijzigde skill al toepassen. Geen fictieve order, toestemming of betalingsbewijs.
