# 2026-10-20 — SalesRobot vroege providercontrole en read-only canary
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Oorzaak
De bestaande LinkedIn-salesmachine controleerde SalesRobot pas ná muterende voorbereidings-RPC, composer, modelgovernance en de comment-generator. Een storing in één van deze afhankelijkheden voorkwam de providercheck, waardoor Supabase een verouderde capability kon tonen. De `dry_run` voerde bovendien SQL-voorbereiding en composer uit.

## Oplossing
Eén provider-readiness probe aan het begin; tijdens normale uitvoering in de bestaande `powerhouse_channel_capabilities_v1` vastleggen voor DM/campagne, op basis van echt accountbewijs. De canary controleert uitsluitend geselecteerde acties, provider en blokkades, en keert terug vóór alle mutaties. Hergebruik diezelfde probe bij verzending; geen tweede Composio-statuscall. Behoud check op licentie/actieve campagne, contactidentiteit/goedkeuring, uitsluitingen en cooldown, kwaliteit, provider-ID/readback, geen dubbele DM.

## Waarheids- en productielimiet
Geen geautoriseerde ontvangers en een verlopen providerlicentie worden niet automatisch groen. Geen verzending en geen test van een echte DM in deze source-PR. Required CI/CodeQL/Preview, protected merge, Edge productie readback en real-world recovery zijn afzonderlijk vereist.
