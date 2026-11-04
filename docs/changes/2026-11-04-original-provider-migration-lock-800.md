# ONE BRAIN — providerregister en migratie-lock weer gelijk

Op **4 november 2026** was de productie van de oorspronkelijke Heartbeat-PR #5389 live, maar de achteraf uitgevoerde volledige BRAIN-run faalde onder andere omdat negen daadwerkelijk toegepaste Supabase-migraties nog niet in de `supabase/migration-history.lock.json` stonden. De oorspronkelijke productieprovider rapporteerde **800 migraties**; de exacte Git-migratiemap bevatte eveneens **800**, zonder ontbrekende of naamafwijkende versies. Alleen het historische bewijsbestand bevatte **791**.

De oorspronkelijke herstelagent hoort providerregistratie, Git-bron en lock na elke beschermde migratie exact te vergelijken en het verschil onder de exclusieve writer-lease te corrigeren. De broncorrectie vult alleen de negen onafhankelijk vastgestelde versies aan en zet `captured_at` op het daadwerkelijk gelezen productietijdstip `2026-11-04T07:43:05.326605Z`. Geen uitrol, SQL-run, betaalde preview, fictieve orders, extra scheduler of autorisatie wordt aangemaakt.

**Negatieve toets:** ontbrekende migratiehistorie, versiebotsingen of ontbrekende versie/naam-pariteit blijven een harde blokkade. Beveiligde PR, Required/BRAIN/CodeQL en controle van de originele productiemigraties blijven verplicht. De overige BRAIN-fouten uit de oorspronkelijke post-merge run en de 306 onbewezen historische provideruitkomsten blijven onafhankelijk open.

Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Oorspronkelijke release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5389.
