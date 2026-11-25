# Originele social-contentcontrole vóór de publicatiedeadline — 3 november 2026

## Waarom
De bestaande Powerhouse had op 3 november 65 actieve cronjobs maar slechts één onafhankelijke van vier dagpublicaties live; de resterende kanalen faalden op persoonlijke LinkedIn-dubbeling, ontbrekende goedgekeurde Mira-mediaproof en blog zonder afzonderlijk redactioneel akkoord. De oorspronkelijke content-loop registreerde de fout of missende publicatie achteraf, maar kon veel voorwaarden eerder zichtbaar maken. De 23 ACTIVE blocker-records zijn niet gelijk aan 23 actuele kanaalfouten en mogen niet blind worden weggewerkt.

## Één originele keten, géén nieuwe executor
De bestaande `powerhouse-content-loop` gebruikt nog steeds zijn oorspronkelijke cron, writer lease, bronagenten en geautoriseerde providerpublishers. De nieuwe pure helper `assessPreventivePublicationReadiness` in de bestaande `daily-publication-recovery.mjs` kijkt tijdens de oorspronkelijke elk-uur-tick tot 12 uur vóór elke bestaande `scheduled_for` naar de originele dagbeslissing en providerverplichting. Voor Mira komt de bestaande, exacte `powerhouse_instagram_media_jobs_v1` job met echte `WAITING_PROOF` of producerclaim erbij. Dit levert een `result.preventive.atRisk` in de bestaande ONE BRAIN content-closed-loop en een herkenbare stap op, nooit een tweede scheduler, providercreate, consent of fake groen.

## Pre-deadline acties
- LinkedIn: aantoonbaar nieuwe bron- en verhaalfamilie, redactionele contractvalidatie vóór de eerste providercreate; bestaande globale duplicate gate en provider side-effect readback blijven onveranderd.
- Instagram: unieke originele claim/lease vóór betaalde creatie; werkelijk 1080×1920 MP4, drie gezichtsframes minimaal 0,940, continue beweging en exacte final-media-SHA vóór originele Meta-provider-ID.
- Blog: primaire feitelijke datering, lezersklare tekst en *echte aparte* editor approval vóór beschermde PR, Netlify en externe URL.
- Provider OAuth of echt menselijk redactioneel akkoord blijft een menselijke bevoegdheidsgrens; bestaande owner-action-notificaties hebben geldige verifieerbare links en een redelijke deadline nodig.

`PREVENTIVE_ACTION_REQUIRED` is een onderbouwd operationeel risico vóór de deadline, niet een reeds gemiste publicatie of automatische toestemming. `NO_PREVENTIVE_RISK_DETECTED` betekent ook NIET dat een providercreate bestaat. De echte publicatie blijft uitsluitend `LIVE_PROVEN` na oorspronkelijke provider-ID/URL-readback.

## Releasebewijs
Targeted originele regressie `tests/brain-social-preventive-readiness-original-loop-20261103.test.mjs`, oude 31-oktober deadline- en handoff-regressies, exact-head Required/BRAIN/CodeQL, beschermde merge, oorspronkelijke Supabase Edge release en onafhankelijke ONE BRAIN volgende natuurlijke cronreadback zijn verplicht. Geen technische garantie van nul toekomstige externe fouten: de norm is preventie, veilig zelfstandig herstel, tijdige mensactie en objectieve afsluiting.
