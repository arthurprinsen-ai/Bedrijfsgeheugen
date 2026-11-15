# Originele terminal: resterend historisch testcontract na volledige BRAIN-reparatie

Datum: 15 november 2026
Eigenaar: bestaande ONE BRAIN / Obligation Terminal Closure, Engineering + Reliability + Data Quality
Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Bronfix: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5825
Aanvullende kandidaat: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5828

## Feitelijk vastgesteld

Protected release #5821 verving een foutieve niet-gepagineerde BRAIN-lookup door `originalBrainFlightSince` plus `brain-verification-flight-index.mjs` op de **volledige native GitHub-providerhistorie**. De echte originele `Unified Brain Delivery` run #43695381458 faalde daarop nog op vier historisch verouderde regressietests. Bestaande PR #5825 herstelde die vier tests en mergeerde beschermd naar `06bc3201131191eea4c01588d3701927db04951b`. Die verbeteringen blijven ongewijzigd.

Daarnaast bevatte de aparte bestaande `tests/github-delivery-state-machine-terminal-closure.test.mjs` nog twee vergelijkbare assertions voor de oude `per_page=100` first-page-only query en `.display_title==$title`. Dat is een rechtstreeks leesbare **bron-testdrift**, geen beweerde vijfde mislukking in eerdere logs.

## Correctie binnen dezelfde lineage

De twee oude assertions zijn vervangen door controle van `created=${created_filter}`, de volledige `gh api --paginate --slurp`-lezing, exacte originele flight-index, beschermd main-source, completed+success en fail-closed bij ontbrekend/partieel providerbewijs. De oorspronkelijke historische test blijft in gebruik. Het nieuwe `tests/brain-original-terminal-extended-state-machine-v1.test.mjs` importeert die bestaande tests en controleert bovendien 206 provider-runs met de juiste originele BRAIN-run pas op de derde pagina; ontbrekende pagina's zijn niet acceptabel.

De bestaande agentrollen Integration Engineer, Reliability en Data Quality dragen verantwoordelijkheid voor het complete terminale contract en realistische uitvoeringsbewijzen. Dit voegt **geen** nieuwe agentinstantie, scheduler, cron, provider, uitvoeringsmachtiging of alternatieve ONE BRAIN-database toe. De al live post-merge-skill en vier tests uit #5825 blijven exact behouden. De overige bestanden zijn een machineleesbare OBSERVED-learning en append-only ontwikkellog.

## Verplichte beveiligde vrijgave

De PR wordt alleen vrijgegeven na exact-head Required, CodeQL, bestaande volledige BRAIN, beveiligde merge, een echte geslaagde originele terminale readback en de juiste learning/skill-projectie. Geen synthetische BRAIN-run of tweede flight. Echte wijzigingen in de productieorganisatie hebben eigen onafhankelijke effectmeting nodig.

## Nog open: innovatie-consumptie

De 14 oorspronkelijke INNOVATION_INTAKE zijn nog PLANNED en 14 INNOVATION_DELIVERY nog OPEN; er is geen authentiek ontvangstbewijs van een van de oorspronkelijke Engineering/CRO-agents en geen gemeten verbeterresultaat. Deze bronfix mag die verplichtingen niet administratief sluiten. De oorspronkelijke eigenaar verwerkt alleen echte source-bound idempotente opdrachten, beschermde implementatie en gevalideerde volgende natuurlijke cyclus voordat enige status `VERIFIED` wordt.
