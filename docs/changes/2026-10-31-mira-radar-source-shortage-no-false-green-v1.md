# Mira-radar: originele materiaaluitkomst mag niet groen lijken wanneer de bron ontbreekt

**Datum:** 31 oktober 2026. **Ouderincident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. **Bestaande uitvoerder:** `powerhouse-mira-problem-radar-v1` (cronjob 120, 20:02 UTC, onveranderd). **Oorspronkelijke selector:** `public.powerhouse_select_instagram_daily_winner_v1`.

## Bewezen probleem

De bestaande Mira-radar zoekt via zijn originele, begrensde acht zoekopdrachten en roept daarna `powerhouse_materialize_mira_problem_recommendation_v1` aan. Die databasefunctie wijst een bron terecht af met bijvoorbeeld `{ok:false,state:'NO_FRESH_PUBLIC_PROBLEM_SIGNAL'}` wanneer bronpublicatiedatum, contract, unieke URL, 90-dagen bronhergebruik of 3-dagen onderwerpherhaling geen geldige winnaar toelaten. De Edge-radar controleerde uitsluitend `mat.error` (technische RPC-fout) en retourneerde vervolgens `ok:errors.length===0`. Een **inhoudelijk mislukte source-selection** kon hierdoor als gezonde radaruitvoering worden gerapporteerd. De dagwinnaar op 31 oktober bleef daadwerkelijk leeg, terwijl de radarscheduler actief was.

## Structurele correctie in één lijn

De bestaande radar gebruikt nu de pure classifier `supabase/functions/_shared/mira-radar-source-result.mjs`. Alleen echte `RECOMMENDATION_MATERIALIZED` en `WINNER_ALREADY_FROZEN` met `ok:true` geven `SOURCE_READY`; bekende bronafwijzingen worden `SOURCE_RECOVERY_DUE`, `ok:false` en `MIRA_UNIQUE_SOURCE_WINNER_REQUIRED`, met eigenaar en exacte oorspronkelijke reden. Onbekend/malform/transportfalen wordt nooit groen. Alleen bij echte afwijzing schrijft de originele radar een door datum en reden idempotent ONE BRAIN-foutbewijs met SHA256; een geslaagde cron/HTTP-ontvangst of status van een ander kanaal verandert dat niet.

Dit veroorzaakt geen extra zoekopdracht, betaalde mediageneratie, cron, nieuwe publisher of parallelle database. De radar blijft op zijn bestaande rooster draaien en de onderwerp-/bronduplicaten, Mira-gezichtscontrole >=0,940, goedkeuring en Instagram-provider-ID blijven harde voorwaarden. Het bestaande beveiligde ondernemersportaal toont via de al live bron-eerst-herstelregel de ontbrekende unieke winnaar; er is geen nieuwe portaalcomponent vereist.

## Regressie en aanvaarding

`tests/brain-mira-radar-source-shortage-readback-20261031.test.mjs` bewijst de drie inhoudelijke bronafwijzingen, echte winnaartoestanden, malformde resultaten, geredigeerde technische fouten, idempotente oorspronkelijke foutregistratie en afwezigheid van extra scheduler/publisher. De wijziging is pas runtime-actief na beschermde Required/BRAIN/CodeQL, merge, exacte Edge-bronpariteit en een volgende normale radar-run. Nog geen enkele nieuwe 31-oktober-Mira-Reel of andere publicatie wordt als geleverd beschouwd zonder extern provider-ID en onafhankelijke readback.
