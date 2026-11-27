# 17 november 2026 — oorspronkelijk Supabase GitOps-register migratie 877 herstellen

Oorspronkelijke eigenaar: bestaande native Supabase GitOps/migratiehistorie-eigenaar, P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Werkelijke bronstatus en impact
Original protected PR #5945 voegde een bestaande composer-email-fairness-migratie 20261117102500_original_composer_email_channel_fairness_v1.sql aan main toe. Onafhankelijke Supabase management list_migrations gaf exact **877 native toegepaste** migratie-identiteiten terug. Canonieke source lock supabase/migration-history.lock.json had 876; elk van de eerste 876 version/name-paren komt exact en geordend overeen met die van productie. Alleen het 877e reeds toegepaste paar ontbreekt. Bestaande Required blokkeerde daarop onder andere oorspronkelijke GitHub-foutobserver kandidaat #5946 met zes productie-/bronidentiteitstests, terecht.

## Reparatie in de oorspronkelijke keten
Breng exact het provider-bewezen ontbrekende paar eenmaal in de al bestaande lock in provider-volgorde. Alle eerdere 876 entries behouden hun oorspronkelijke versie/naam en volgorde; project_ref behoudt exacte productie-ID. captured_at is het werkelijke nieuw verzamelde broncontroletijdstip. Geen SQL-migratie opnieuw uitvoeren, geen parallelle GitOps-writer, geen nieuwe scheduler, geen extra tabellen, geen scope/budget-aanpassing of Required/CodeQL bypass.

## Structurele preventie en oplevering
De originele migration-producer moet na iedere beschermde toegepaste DDL de provider-native migration history uitlezen en deze exacte versie/naam vervolgens als afhankelijk bron-lock-ACK aan de originele release- en consumerkant afleveren voordat andere agents hun eigen PR's op die main-versie proberen af te sluiten. Een bestaande GitOps-bronfout opent dezelfde familie in ONE BRAIN, geen generiek CI-herstel in elke andere PR. Test volledige 877/877 exact bron- en providerovereenkomst, nul duplicaten; laat oorspronkelijke Required, CodeQL en migratiehistorietests passeren. Na protected merge onafhankelijke readback van actuele main-lock en originele provider; pas dan deze deelreparatie groen. E-mailverzending, sales, content en autonome closure zijn niet hiermee bewezen.

Bronnen: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5945 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5946.
