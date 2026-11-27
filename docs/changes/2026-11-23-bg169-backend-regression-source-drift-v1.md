# BG169 backend-regressies: oorspronkelijke bron herstellen

Datum: 23 november 2026 · Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Aanleiding en bewijs
De beveiligde productie-uitvoerder **BG169** heeft de bestaande blog-workflowfix [#6119](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6119) terecht tegengehouden. De onafhankelijke backend-testlane in [run 45142550416](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45142550416) bevat precies drie mislukte assertions. Required/CodeQL op de blogfix zelf waren groen, maar dat is geen vervanging voor de volledige BG169-test.

## Kleinste broncorrecties
1. Het eenmalige bewijs van providerhistorie versie 888 was gekoppeld aan een voortdurend groeiende actuele lockfile. De historie van de eerste 888 versies wordt nu afzonderlijk uit de bestaande actuele append-only historie gereconstrueerd. De oorspronkelijke exactheidseisen voor versie 886→888, beveiligings-SQL, oorspronkelijke SHA en tamper-rejecties blijven intact.
2. De productie-readback controle is overgegaan op de gedeelde `tools/delivery/netlify-deployment-applicability.mjs`. De test controleert nu deze echte dependency en de vereiste control-plane paden, niet langer niet-bestaande inlined verwijzingen. Negatieve runtime-supersession blijft verboden.
3. `db-pooler-introspect-v1` importeerde een type-only `jsr:` manifest tijdens bundling. Die onnodige import is verwijderd, zonder de PostgreSQL-query, authenticatie, JWT-beleid of productie-instellingen te wijzigen.

## Verplichte verificatie
De drie aangepaste/aanwezige regressies moeten slagen op exacte PR-head, samen met de oorspronkelijke full Required, CodeQL, overige beveiligingschecks, beschermd BG169-promotiepad en onafhankelijk Supabase/Netlify/live-readback. Verifieer daarna een echte oorspronkelijke blog-publicatie met inhoud, providerbewijs en ONE BRAIN/Heartbeat-uitkomst. Geen nieuwe scheduler, publisher, provider of directe main-write. Een MERGED-status is geen LIVЕ_PROVEN-status.

De actuele fouten blijven OPEN totdat de originele uitvoerder én een onafhankelijke productiewaarneming dit werkelijk bevestigen.
