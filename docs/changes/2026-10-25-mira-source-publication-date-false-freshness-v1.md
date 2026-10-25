# Fail-closed originele publicatiedatum voor Mira — 25 oktober 2026

Parent-P0: #4439, #4198
Obligation-ID: `mira:source-date-provenance-before-daily-winner:20261025-v1`
Fingerprint: `mira|source-freshness|source-observed-at-substituted-for-publication-date|20261025-v1`
Delivery-Lane: backend

## Productie-incident, bevestigd met bronbewijs
De bronagent gaf een artikel gepubliceerd op **3 oktober 2022** een versheidsscore van **0,8**, alleen omdat het op **24 oktober 2026** opnieuw in de zoekresultaten verscheen. Dat gebeurde door de letterlijke constante `const recency=0.8` in de bestaande `powerhouse-mira-problem-radar`. De database bevatte `source_published_at=NULL`, `observed_at=2026-10-24`, `eligible=true`. Het bestaande materialisatiepad keek uitsluitend naar `observed_at>=now()-10d`, niet naar de oorspronkelijke bronpublicatie.

## Eén causale herstelroute
- Pure gedeelde datumparser: strikt bronmetagegeven of datum vóór de tekst, met `3 okt 2022` en ISO-datums; tegenstrijdige/ongeldige/toekomstige/onbekende datum → nul en `eligible=false`.
- Nieuw gedateerd artikel maximaal **60 dagen oud**; bronpublicatiedatum en gedateerde status opgeslagen zonder te verwarren met crawl-tijd.
- De reeds bestaande `public.powerhouse_materialize_mira_problem_recommendation_v1` beveiligt de bron zelf, inclusief reeds opgeslagen signalen, met `source_published_at` binnen de daggebonden grens.
- Bestaande bevroren winnaars, provider/rechtenscope, anti-duplicatie, media-Mira-identiteitsgate, source-topic-publisher, inkoopbudget, omzetregistratie, crons en Brain blijven intact.
- De huidige video van 25 oktober is al gegenereerd: die wordt niet stilzwijgend van bron of datum gewijzigd en blijft zonder onafhankelijke face/temporal/provider-proof **niet** groen.

## Verifieerbare acceptatie
`node --test tests/brain-mira-source-freshness-20261025.test.mjs` (historische 2022-case, recente geldige datum, dataloze bron, conflicterende provider/snippetdate, toekomst/ongeldige kalenderdag, SQL-gate). Voor database/Edge: exact-head GitHub Required+CodeQL, geslaagde provider-managed Supabase-preview, beschermde merge, service-role migration en actuele Edge source version in productie. Authenticated publicerende lus voert pas bron-acties uit na de bestaande content- en medialock.

Zonder die bewijsroute is dit **CANDIDATE — NIET PRODUCTIE-LIVE**. Geen tweede scheduler, geen extra media-creditverbruik en geen gefingeerde uitkomst.
