# 9 november 2026 — originele commerciële onderzoeks- en verzendketen

- **Obligation:** `commercial|research-composer-handoff|20261109-v1`
- **Verifieerbare productiestatus:** canonical outreach cron 112/113/114 en commercial stage cron 116 slagen; Gmail preflight slaagt. Beide originele e-mails op `prepared`, nul provider-acknowledged verzendingen in de vorige 30 dagen. Eén originele brononderzoekstaak heeft een goedgekeurd bedrijfsspecifiek nieuwsrecord; één blijft zonder bewezen bron wachten.
- **Oorzaak:** composer gebruikt het inmiddels voltooide brononderzoek van dezelfde action-ID niet en herhaalt `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`. De interne researchstatus `done` is nooit een extern resultaat.
- **Owner:** originele `powerhouse-commercial-message-composer`, aanvoer door dezelfde `relationship-research:outreach-source:<action-id>`-research.
- **Reparatie:** de in-memory composercontext wordt uitsluitend gevoed uit sluitende research+canoniek goedgekeurd nieuws (identiteit, URL, tijdvenster, confidence) en doorloopt dan de originele kwaliteits-, ontvanger-, suppressie- en providercontroles. Geen alternatief mailsysteem of extra scheduler.
- **Test:** `tests/brain-verified-research-composer-handoff-20261109.test.mjs` — positief geval en negatieve gevallen voor vreemde personen/bedrijven, stale bron, ongeverifieerd resultaat, ontbrekend heronderzoek en geen impliciete verzendrechten.
- **Broncode:** `supabase/functions/_shared/verified-research-composer-handoff.mjs`, `supabase/functions/powerhouse-commercial-message-composer/index.ts`.
- **Bewijsgrens:** vóór geslaagde verplichte checks, merge en Supabase productie-readback `FIX_CANDIDATE_NOT_LIVE`. Na deployment blijft `sent` onwaar zonder echte provider-ID en onafhankelijke readback; revenue alleen na gekoppelde werkelijke omzet.
- **Preventie:** nooit succes claimen op cron/HTTP-start, interne `done`, concept, hypothetische intent of niet-gerandomiseerde CRO/Innovation-resultaten.

Incident in bestaande ONE BRAIN runtime-events: `p0-20261109-commercial-research-composer-handoff`.
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


## Addendum: operationele funnelanalyse in dezelfde closing watchdog
- Geobserveerde cohortdata (2026-11-09, laatste 7 dagen): 11 orig. e-mailacties, 11 gelinkte researchacties, 4 afgeronde met bron, alle 4 originele e-mails toch verlopen, 0 bewezen composerkwaliteit, 0 bewezen providerreceipt, 0 replies. Experimenteerregister: 1 totaal, 0 laatste 30 dagen, 0 treatment/holdout laatste 30 dagen.
- Oorzaak: succesvolle interne schedulersteps maskeren verlies van context tussen originele brononderzoek- en composeractie. Geen bewezen observaties voor experimenten of omzet.
- Herstel: `handoff_measurement` wordt in bestaande `bg_gezondheid` van `powerhouse_commercial_action_closure_watchdog_v1` meegeschreven; dezelfde `action_id`-cohort en 7d denominator, expliciete onderzoeksuitval, laatste kwaliteitsbewijs, provider-ID en readback, replies en sample/maturity van bestaande `persuasion-revenue-optimizer-v1`-experimentpolicy.
- Data-uitkomsten zijn observaties, geen causaal bewijs. Leg treatment en holdout uitsluitend via bestaande policy en assignment-owner vast; pas experimentadviezen toe na analyse, controle op contaminatie en voldoende daadwerkelijke provider/outcome-readbacks.
- Regression: `tests/brain-verified-research-composer-handoff-20261109.test.mjs`. Geen nieuwe cron, parallel database of verzender. Protected release PR #5543 en bron-/provider-readback blijven vereist.


## Handoff assurance — meetbewijs en leercontract
- Productiebaseline gecontroleerd via read-only SQL: 11 `autonomous_email` acties in zeven dagen; 11 expired; 4 research done / originele composer ontbreekt, 7 overige geen levering.
- Huidige experimentautoriteit: 1 treatment, 0 holdout, minimum 20 voltooide observaties per arm. Geen valide effectgrootte of uplift.
- Geen wijziging aan bestaande scheduler, commerciële brondata, ontvangers, bestaande policy, provider of verzendlimiet.
- De SQL-view is read-only, SECURITY INVOKER, beperkte uitvoer voor service_role; bestaande e-mailwatchdog is de **enige** owner die de meetuitslag in de bestaande `bg_gezondheid` registreert.
- `EXPLAIN (FORMAT JSON)` en read-only productiequery op de nieuwe telemetrie-selectie zijn succesvol uitgevoerd; de werkelijke `handoff_state`-verdeling is 4 `BROKEN_RESEARCH_TO_COMPOSER_EXPIRED`, 7 `EXPIRED_WITHOUT_DELIVERY`. Dit is geen deploymentbewijs.
- Geen causale experimentclaim zonder voldoende gematureerde treatment én holdout, onafhankelijke echte uitkomst, anti-contaminatie, onveranderlijke experimenttoewijzing en retrospectief gemeten effect.
- Bestaande PR #5543 blijft OPEN tot originele branch-associatie, required CI, protected merge en echte Supabase/productie-readback. Status nog steeds `DEGRADED`.
