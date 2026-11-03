# LinkedIn persoonlijk 30 oktober: bronfeit ontbreekt, geen OAuth-herhaling

Datum 2026-10-30. Eigenaarschap: oorspronkelijke Bedrijfsgeheugen Powerhouse/ONE BRAIN/Heartbeat, één contentwriter en bestaande admin-only Portal V2.

## Feitelijke oorzaak
- Originele Supabase `public.content_publication_obligations` voor 30 oktober: LinkedIn persoonlijk `BLOCKED`, `last_error=PERSONAL_SOURCE_UNVERIFIED`, `evidence.personal_truth_verified=false`, zonder provider-ID. Dit is dus een bron-/waarheidscontrole, **niet** de eerdere gerepareerde OAuth-`unauthorized_scope_error`.
- Zes recente externe bronrecords zijn eligible in de bestaande `powerhouse_mira_problem_signals_v1` `personal-observational-life-source-v1` feed. Dat is bronbeschikbaarheid, geen geverifieerd eigen, uniek verhaal. Stuur geen post totdat bron, datum, feitelijke situatie, oorzaak-gevolg, persoonlijke invalshoek en duplicaatfamilie oorspronkelijk zijn geverifieerd.
- Op 30 oktober staan LinkedIn bedrijf en Instagram `PLANNED`; de blog is `GENERATED` met artefactwaarheid, maar vereist nog eigen oorspronkelijke URL/provider publicatiebewijs. Geen automatische omzet-/bereikclaim.
- Oorspronkelijke crons 116,130,171 waren alle actief. Laat uitvoer en duplicaatbeveiliging aan staan, zonder extra publisher/scheduler/Make- of Buffer-uitwijkroute.
- De eerdere persoonlijke 29 oktober post is `PUBLISHED` met provider-ID en `republish_forbidden=true`; de oorspronkelijke GET-readback blijft 403. Nooit opnieuw versturen om deze bron- of OAuth-fout te onderzoeken.

## Verbetering in de bestaande architectuur
De bestaande Brain-observability-module, bestaande admin-only Netlify-route `/api/powerhouse-observability`, Portal V2-kaart en huidige Powerhouse-social-herstel-skill herkennen de specifieke `PERSONAL_SOURCE_UNVERIFIED` nu met enkel veilige herstelcode `PERSONAL_SOURCE_FACT_UNVERIFIED_VALIDATE_BEFORE_DRAFT`. Toon in het portaal de menselijke verificatiestap vóór concept-/publicatiegoedkeuring. Ontbrekende waarheid blijft BLOCKED; geen scripts om de truth flag op waar te zetten, geen tweede scheduler, geen secrets en geen externe post.

ONE BRAIN fingerprint `linkedin|personal|source-fact-unverified-but-feed-eligible|20261030-v1`; regressie inclusief no-repostvoorwaarde, menselijke documentatie, activity ledger en System Map-generator opnieuw te controleren.

## Release- en bewijsgrens
Deze wijziging is pas live na protected Required/BRAIN/CodeQL, exacte GitHub main, Netlify READY exact same SHA en originele geauthenticeerde adminbrowser/negative tenant readback. Echte agenttoepassing, nieuw geverifieerd bronverhaal en provider-publicatie horen bij afzonderlijke eerstvolgende natuurlijke bronrun. OPEN totdat onafhankelijk bewezen.
