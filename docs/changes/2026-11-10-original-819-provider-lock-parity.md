# 10 november 2026 — herstel originele Supabase-migratiehistorie 819/819

**Probleem.** De beschermde oorspronkelijke PR #5554 heeft migratie `20261110073500_original_content_handoff_receipts_v1` via de native GitOps-route echt in productie gebracht. De bestaande GitHub-bron `supabase/migration-history.lock.json` bevatte daarna nog de 818 eerdere, juiste versies. Daardoor faalde de onveranderde preflight van PR #5543 terecht bij vergelijking van lokale uitvoerbare migraties met de vastgelegde providerhistorie.

**Onafhankelijk bewijs.** Supabase-project `adhjwmvyoixzjtmiroln` meldde 819 migraties, 819 unieke versies en als nieuwste echte versie `20261110073500_original_content_handoff_receipts_v1`; herlezen op 10 november 2026 08:19:43.652162 UTC. De bestaande `main`-bron bevat precies deze originele SQL, geen verzonnen identiteit.

**Correctie.** Alleen het oorspronkelijke lockbestand is aangevuld met de reeds echt toegepaste provideridentiteit, 818 → 819 in dezelfde oplopende volgorde, plus het controletijdstip. De originele bestaande migratie-SQL blijft byte voor byte ongewijzigd. Geen DDL, nieuwe migratie, e-mail, social-send, scheduler, security-ACL, fallback of tweede keten.

**Releasevoorwaarden.** Exacte beveiligde GitHub Required en CodeQL; origineel Supabase Hosted Preview; protected merge; daarna provider-productie opnieuw 819/819 onafhankelijk vergelijken met de oorspronkelijke `main`-lock en SQL-manifest. Vervolgens moet PR #5543 de nieuwe provider-getrouwe `main` incorporeren, opnieuw door de volledige exacte checks en via de oorspronkelijke GitOps-route uitrollen. Geen status GREEN op alleen een commit, provider-login, cron-success of PR-preview.

**Incident/leren.** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Preventieregel: na iedere geautoriseerde native Supabase-productiemigratie moet het al toegepaste provider-`version/name` onmiddellijk in de bestaande history-lock worden gereconcilieerd voordat een volgende migratie-PR als CI-beoordeelbaar wordt gezien.
