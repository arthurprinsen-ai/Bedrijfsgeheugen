# Originele LinkedIn-bedrijfspostmetingen blijven brongebonden (10 november 2026)

## Waarom
De Windsor.ai `linkedin_organic`-bron gaf echte metingen terug. Bij de overdracht naar de oorspronkelijke Supabase-sociale leerlus ontbrak de accepteerbare veldidentiteit, doordat de bron `identity` en `account_id` gebruikt en de bestaande afnemer alleen `post_identity` en `account` kende. Een technisch geslaagde verwerkingsrun leek daardoor beter dan de daadwerkelijke post- en leerdekking.

## Wat er is aangepast
Alleen de oorspronkelijke `supabase/functions/_shared/linked-company-analytics.mjs` accepteert voortaan beide exacte Windsor-native veldvormen. De controles op het werkelijke provideraccount, originele organisatie-URN, onafhankelijke LinkedIn-readback, immutable post-URN, meetdatum en toegestane niet-negatieve waarden blijven verplicht. Bij tegenstrijdige accountidentiteiten wordt de observatie geweigerd. Een nieuwe regressietest spiegelt het echte 10-nov-bronformaat.

## Waar de keten loopt
Bestaande Windsor-import → bestaande `powerhouse_growth_source_daily_v1` → oorspronkelijke zesuurse `bg-social-metrics-sync` → bestaande `social_metric_snapshots` → oorspronkelijke `powerhouse_backfill_social_learning_applications_v1` (#171 BRAIN) → latere geautoriseerde publicatie met volledige outcome/readback.

## Productiebewijs en resterende acceptatie
Op 10 november zijn vier LinkedIn-bedrijfsposts van 6–9 november providerbewezen, met nieuwe metingen in de bestaande snapshots en originele beschrijvende BRAIN-evaluaties. Een tweede BRAIN-uitvoering was idempotent. Dat is **geen** bewijs van extra leads, omzet of experimenteel causaal effect. De codecorrectie is pas productie-groen wanneer de beschermde PR is gemerged, de originele Edge-deploy aantoonbaar hetzelfde bronbestand gebruikt en een nieuwe natuurlijke Windsor-observatie zonder handmatig metadataherstel door de hele keten gaat. Achterstallige historische leerverplichtingen blijven zichtbaar.

## Voorkomen van herhaling
Verplicht regressies op echt actuele verbonden-provider-schema's in plaats van uitsluitend fixtures. Het succes van een cron/HTTP-call telt niet als post-specifieke ontvangers-ACK. Geen tweede scheduler, geen duplicatie van berichten, geen synthetische omzet en geen omzeilde toestemming.

Canonieke incident- en werkregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 en PR #5569.
