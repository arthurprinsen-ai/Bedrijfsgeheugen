# Onderzoek daadwerkelijk laten landen in commerciële e-mails — 9 november 2026

## Gebeurtenis
Het commerciële Powerhouse verwerkte relaties en draaide zijn bestaande dagelijkse en uurlijkse taken. Toch leverde de keten geen bewezen nieuwe e-mailverzending. Een persoonsgerichte e-mail had terecht een concrete openbare aanleiding nodig. Die aanleiding werd voor één actie inmiddels aantoonbaar gevonden en als goedgekeurd bedrijfsnieuws opgeslagen, maar bereikte de oorspronkelijke berichtmaker niet.

## Wat verandert
De originele `powerhouse-commercial-message-composer` haalt een afgerond onderzoek automatisch terug in dezelfde e-mailactie. Eerst matcht het de bron met de precieze persoon, organisatie en originele onderzoekstaak. Vervolgens controleert het of het bedrijfsnieuws door de bestaande bronlaag is goedgekeurd, voldoende betrouwbaar en recent is. Alleen dan wordt de tekst opnieuw samengesteld en door de bestaande kwaliteitscontrole gehaald. De tweede e-mail waarvoor nog geen echt bewijs bestaat, blijft terecht wachten.

## Wat onveranderd blijft
E-mails gaan pas weg na bestaande bevoegdheids-, toestemming-, uitschrijf-, druk- en duplicatiechecks. Succes vereist een providerbevestiging en onafhankelijke readback. Geen tweede executor, nieuwe scheduler, kunstmatig bronbewijs of onbeperkte mailcampagne. Externe signalen zijn mogelijke aanwijzingen, geen bewezen koopintentie.

## CRO/Growth en lerend vermogen
Voortgang wordt per fase bewezen: bruikbare connecties, geverifieerde aanleiding, kwaliteit goedgekeurd, verzonden, provider bevestigd, antwoord, afspraak, order, betaalde omzet. Een cron die slaagt is niet de commerciële KPI. Experimenteerresultaten worden pas bewezen beschouwd bij voldoende valide vergelijkbare uitkomsten, liefst met behandeling en controlegroep; zonder voldoende data blijft het oordeel **INSUFFICIENT_EVIDENCE**.

## Bewijs en status
Regression: `tests/brain-verified-research-composer-handoff-20261109.test.mjs`. Verplichte GitHub CI, CodeQL, merge en productie-readback zijn nodig vóór live-status. Er is geen nieuwe verzending of omzet aangetoond door deze broncodewijziging.
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5543


## Addendum 9 november 2026 — herstel van voortijdig verlopen acties
De oorspronkelijke closure-watchdog liet e-mails met een geldige onderzoekstaak na zes uur verlopen terwijl brononderzoek of composer nog niet was afgerond. Ook de oorspronkelijke e-mailwatchdog kon een `waiting` actie na twintig minuten terugzetten naar `prepared` zonder bewijs dat de composer het brononderzoek had geaccepteerd. Beide overdrachten behoren tot één keten en zijn in dezelfde PR hersteld.

- Originele actie wordt maximaal 48 uur op `WAIT_FOR_VERIFIED_SOURCE` gehouden als bijbehorend onderzoek werkelijk bestaat en aan dezelfde persoon en organisatie toebehoort.
- De generieke watchdog blijft af van die onderzoekshold en rapporteert hem als een waarschuwing, niet als verzonden mail.
- Alleen de originele composer zet `waiting -> prepared` na bronverificatie én geslaagde kwaliteit; de originele sender controleert vervolgens ontvangersautorisatie, opt-out, dedupe en providerreadback.
- Na 48 uur zonder goedkeuring wordt de actie veilig `expired` en alleen nieuw actueel bewijs mag een nieuwe, gededupliceerde commerciële actie opleveren.
- De twee reeds op 9 november verlopen acties worden niet heimelijk heropend en niet als verstuurd gemeld.

Bron/migratie: `supabase/migrations/20261109144500_powerhouse_outreach_research_wait_handoff_v1.sql`.
Technische en businessbewijsgrens: pas na beschermd merge, Supabase migratie/Edge readback en een echte providerbevestiging is de release aantoonbaar operationeel.


## Meet- en experimenteercontract (dezelfde originele watchdog)
Het productieonderzoek op 9 november toonde in het zeven-dagen-cohort **11** `autonomous_email`-acties, **11** gelinkte onderzoeksacties, **4** afgeronde brononderzoeken waarvan de originele e-mail **alle vier** `expired` was, **0** composer-quality records, **0** externe providerbevestigingen en **0** provider-gelinkte replies. Uitkomst bij huidige data: onvoldoende experimentbasis; in het experimentregister één toewijzing historisch, nul de laatste dertig dagen en geen actuele holdout.
De bestaande closure-watchdog gaat voortaan in zijn normale `bg_gezondheid`-output alle onderling gekoppelde stappen meten, met `action_id` als bronidentiteit: research ontvangen en voltooid; of uitgevoerd onderzoek vóór composer is verloren; laatste composerkwaliteit; originele actiestatus; acceptatie met externe provider-ID; onafhankelijk provider-readback; gelinkte reactie. Hij rapporteert expliciet het eerstvolgende falende overdrachtspunt én berekent research→composer-dekking alleen als de noemer groter dan nul is. Intern 'done' of cron 'ok' telt nooit als externe salesoutput.
CRO/Innovatie gebruikt de bestaande 50/50-behandelings-/controlegroeppolicy `persuasion-revenue-optimizer-v1` (minimum twintig volwassen uitkomsten per arm) en schrijft alleen een `READY_FOR_CAUSAL_EFFECT_ANALYSIS` als beide armen de beleidsdrempel behalen. Zelfs dit is nog geen significant of bewezen lift; daarvoor is aparte effectanalyse met onzekerheid, omzetbewijs en validatie nodig. Nul sample/ontvanger = `INSUFFICIENT_EVIDENCE_NOT_LEARNED`.
Status: releasekandidaat, **niet live**; zonder beveiligde merge, Supabase-preview en exacte productiecontrole geen succesclaim. Geen tweede executor, geen ongevraagde e-mails.


## Meetbare overdracht en experimentontwerp
De oorspronkelijke onderzoeks-/composer-/verzendketen krijgt **twee read-only databaseviews**, geen nieuwe opslag of scheduler. De oorspronkelijke e-mailwatchdog registreert bij de al bestaande periodieke uitvoering de scorecard onder `original_handoff_scorecard_7d` in het bestaande gezondheidsevent:
- `powerhouse_commercial_handoff_telemetry_v1`: uitsluitend bestaande actie-ID's, research, berichtkwaliteitsresultaat, provider-ID/ACK/readback en gekoppelde werkelijke reply, afspraak of omzet. Bijna-geslaagde overdrachten worden expliciet geclassificeerd.
- `powerhouse_commercial_handoff_scorecard_v1`: dezelfde feiten als zeven-dagen-funnel plus categorische diagnose `DEGRADED`, `NO_PROVIDER_DELIVERY_PROVEN`, `NO_ELIGIBLE_ACTIONS_OBSERVED` of `PROVIDER_DELIVERY_PROVEN_OUTCOME_LEARNING_SEPARATE`. Dit is **geen** claim dat een CRO- of omzetlus groen is.
- SLA's voor **diagnose**, niet voor het forceren van verzending: 60 minuten van afgerond publiek brononderzoek tot goedgekeurde composer-evaluatie; 30 minuten van goedgekeurde kwaliteit tot aantoonbare provideracceptatie. Het oorspronkelijke onderzoekswachtvenster blijft maximaal 48 uur. Meet vooral ook hoeveel van de noemers werkelijk eligible zijn, en markeer nul-opportunities als geen bewijs.
- Providerbewijs = origineel provider-ID + echte provider ACK + vastgelegde onafhankelijke readback, **niet** enkel interne uitvoering of groene cron.
- Analyseer de grootste werkelijke bottleneck per cohort, oorzaak, segment, behandeltijd, uitvalpercentage, betrokkene en bewijs. Werk in dezelfde lineage en voer pas na onafhankelijke readback en toestemming een volgende interventie uit.

**Feitelijke productiebaseline 9 november 2026, ±13:55 UTC:** 11 originele e-mailacties van zeven dagen, alle 11 expired, 4 met afgerond brononderzoek maar geen consumer-overdracht, 7 overige zonder levering, 0 bewezen recente versturingen. Actief experiment `persuasion-revenue-optimizer-v1` heeft 1 matured treatment, 0 matured holdout bij minimum 20 per arm en status `INSUFFICIENT_MATURED_ASSIGNMENTS`. Geen causaal rendement of verkoopclaim. De meetviews staan nog op een PR-branch, niet live; de tekst toont een read-only query-baseline, geen productierollout.

**Experimenteerregel:** gebruik alleen de bestaande policies en toewijzingen, maak vooraf één hypothese en primaire uitkomst (bijv. valide reply→afspraak→betaalde omzet), houd treatment/holdout gelijkwaardig, registreer aan het begin een cohort en een meetvenster, voorkom gelijktijdige experimentbesmetting, respecteer toestemming en opt-out. Laat de evidence-status onbeslist tot de officiële samplefloor, onafhankelijke data en echte meetuitkomsten voldoende zijn. Zonder voldoende n geen winnaar, geen automatische promotion.


## Original social-metrics→publication-handoff repair
Aanvullend bewijs 9 november: bestaande `bg-social-metrics-sync` had een onafhankelijk geobserveerde Composio-snapshot van 5 reacties voor originele persoonlijke LinkedIn-post van 9 november en 8 reacties voor 8 november; beide originele publicatieverplichtingen hadden `measured_at=NULL`. Hetzelfde systeem had 4 exact gekoppelde Windsor-bedrijfs-postmetrieken, maar niet de bedrijfspost van 9 november. De vorige provider-sync receipt meldde gezond op metrics-ingest, terwijl het oorspronkelijke publicatiecontract niet werd gevuld.
Dezezelfde beschermde PR breidt daarom **de bestaande** zesuurs-observer `bg-social-metrics-sync` uit, met de pure helper `_shared/original-publication-metric-handoff.mjs`. Alleen EXACT live-proven oorspronkelijke post/tenant/provider ID, bron, meetvenster ≥24 uur en onbeschadigde status mogen `measured_at` en de strikt gescopeerde `metrics.original_provider_metric_handoff` via CAS vullen. `learned_at` blijft onbewezen tot de originele social-learning owner aparte provider- en toepassingsverificatie registreert. Nieuwe nulstatistieken, publicaties of verzendpogingen zijn verboden; geen alternatieve worker/queue/timer.
Releases blijven afhankelijk van native Supabase Preview (nu `PREVIEW_BRANCH_UNASSOCIATED`), Required, CodeQL, beschermde merge, deploy en natuurlijke originele providerreadback. Niet als live claimen uit source tests alleen.
