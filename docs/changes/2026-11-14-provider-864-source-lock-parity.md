# 14 november 2026 — provider 864 ↔ originele Supabase-lock 864

Deze wijziging herstelt uitsluitend een feitelijke migratie-overdracht tussen dezelfde originele Supabase-productie en het GitHub-bronarchief. Geen tweede scheduler, database, agent, CRM of e-mailverzender.

## Onafhankelijk vastgesteld
De beschermde innovatie-PR [#5800](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5800) is als `cdb73c78705df28c98a2fc56a98421dff4cabe32` gemerged. Native Supabase-project `adhjwmvyoixzjtmiroln` rapporteert op 14 november om 19:56:48 UTC **864** daadwerkelijk toegepaste migraties, met als laatste `20261114235900 innovation_original_agent_intake_recovery_v1`. De historische lock in `main` bevatte nog 863 identiteiten; de eerdere 863-pariteit was apart beschermd en bevestigd in PR #5805.

## Gerichte archiefcorrectie
Voeg uitsluitend het native toegepaste 864e `version/name`-paar toe aan `supabase/migration-history.lock.json`, met het werkelijke providercontroletijdstip. Behoud de eerdere 863 identiteiten. De bron-SQL staat al op `main`. Voer de migratie niet opnieuw uit en maak geen vervangende database, cron, publicatie- of contactenketen. Het oorspronkelijke Supabase-releaseproces controleert exact-head Required, CodeQL, echte provider-preview en de onafhankelijke bron ↔ productie-readback.

## Niet ten onrechte groen verklaren
De afhankelijke oorspronkelijke zakelijke webresearch-PR [#5802](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5802) is geen onderdeel van deze lock-correctie. Tot zijn eigen onafhankelijke merge, Supabase Edge-readback en bron-/consumentbewijzen blijven de huidige **23.295** connecties, **605** opgeslagen e-mailadressen en **0** nieuwe publiek bevestigde contactkandidaten de laatst aangetoonde stand. De bestaande OPEN-verplichting in ONE BRAIN blijft open tot daadwerkelijk getraceerde original #116 → #138 → Heartbeat-verwerking en gemeten resultaat.

Het structurele preventiedoel: de **bestaande** migratiearchief-eigenaar reconciliëert elke werkelijk toegepaste migratie na de oorspronkelijke protected merge, vóór afhankelijk werk wordt vrijgegeven. Geen blokkades verbergen, geen statuschecks omzeilen.
