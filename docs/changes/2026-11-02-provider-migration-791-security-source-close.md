# Source-close: beveiligingsmigratie 791/791

**Datum:** 2 november 2026  
**Oorspronkelijk incident:** `supabase|revenue-learning|migration-history-lock-stale-after-production-20261029`  
**Eigenaar:** bestaande ONE BRAIN/Supabase GitOps-migratie-eigenaar.

## Oorzaak
De vorige bronregistratie bevatte precies 790 toegepaste productiemigraties. Na de beschermde beveiligingsmigratie `20261102141045_writer_control_fixed_search_path_v1` bevat de oorspronkelijke Supabase-provider 791 unieke versies. De uitvoerbare Git-SQL bevat dezelfde nieuwe versie, maar de oorspronkelijke lock was niet opnieuw vastgelegd.

Dat veroorzaakte vijf falende migratiebroncontroles in BRAIN-run `41460310537` en blokkeerde de terminale oplevering van beveiligings-PR #5307. Required CI en CodeQL voor de beveiligingscode zelf slaagden; de fout is daarom een **bronregistratie-afwijking**, geen bewijs van een onveilige SQL-replay.

## Gerichte correctie
De volledige oorspronkelijke providerregistratie en de 790 bestaande lockregels zijn vergeleken op exacte versie en naam. Er was één uitsluitend ontbrekende lockregel. De 791e registratie is toegevoegd en het provider-observatietijdstip is geactualiseerd. Geen SQL, RLS, grants, credentials of cronjobs zijn veranderd.

## Acceptatie
De bestaande 5 falende regressies en de volledige BRAIN-controle moeten slagen. Verder blijven Required/CodeQL, exclusieve writer, beschermde merge, onafhankelijke productiebewijscontrole en originele incidentregistratie verplicht. Een geslaagde PR alleen is niet genoeg om het incident als definitief opgelost of alle platformbeveiliging als groen te markeren.
