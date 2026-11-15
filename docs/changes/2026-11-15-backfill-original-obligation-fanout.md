# ONE BRAIN — stop herstelfan-out op historische bronkandidaten
Datum: 2026-11-15. Bestaand P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Productieobservatie
Het bestaande `Completion Supervisor Backfill Resume` (workflow `.github/workflows/completion-supervisor-backfill-shadow.yml`) verzendt binnen `tools/outcome-obligation-completion-supervisor-backfill.mjs` één event per historische unieke kandidaat-identiteit. De oorspronkelijke backfillbron bevat duizenden `AgentWork/PENDING`-rijen met slechts enkele oorspronkelijke `obligation_id`-waarden. Op 15 november groeide het aantal `AgentWork/PENDING` gedurende de lopende originele backfill van 3.516 naar 3.721, terwijl de live workflow nog `in_progress` was. De grootste groep was `material-change-live-verification`, ruim 3.200 bronrijen. Historische bron- en herstelbewijzen waren voor het overgrote deel nog niet aantoonbaar `PROCESSED`. Dat ondersteunt een bronfan-outfout; geen uitspraak over hoeveel externe provideracties daadwerkelijk gemist zijn.

## Concrete oorzaak en correctie
De oude `activeDispatches` produceerde één nieuwe `coalesceKey` per `candidate.lineageKey`, ook als duizenden kandidaten exact dezelfde oorspronkelijke geregistreerde verplichting betroffen. De originele workflow riep vervolgens de oude ONE BRAIN-runtime eenmaal per kandidaat aan en creëerde duizenden aparte `PENDING`-dispatches. Deze wijziging houdt `report.candidates` en alle originele append-only bronrecords ongewijzigd, maar groepeert enkel de herstart-triggers per **geregistreerde oorspronkelijke obligation_id**. Een stabiele, periode-onafhankelijke `completion-backfill|obligation|<hash>`-coalesceKey en fingerprint zorgen dat volgende natuurlijke runs exact dezelfde onveranderlijke CAS-identiteit teruglezen in plaats van nieuwe pending-opdrachten toe te voegen.

Per oorspronkelijke verplichting bevat het backfill-rapport `sourceCandidateCount` en SHA-256 `sourceIdentityDigest` van alle gesorteerde originele kandidaten. Dat is een samenvatting van dekking, **niet** een ontvangst- of voltooiingsbewijs. `WAIT_EXTERNAL`, niet-geregistreerde verplichtingen en veiligheidsgrenzen blijven behouden. Geen nieuw cron-proces, agent, publisher, store, queue, provider-send, migratie of historische bulkafsluiting.

## Contract en regressie
- De bestaande eigenaar houdt iedere oorspronkelijke kandidaat en pending-processtatus totdat echte source-bound agent `PROCESSED`, onafhankelijk productie-/providerbewijs en Heartbeat-/uitkomstcontrole aanwezig zijn.
- Identieke bronhistorie in andere volgorde geeft exact identieke dispatches en digests.
- Bij 1.201 kandidaten voor dezelfde oorspronkelijke verplichting ontstaat precies één herstart-trigger. De tweede geregistreerde verplichting krijgt één aparte trigger. Alle 1.202 historische kandidaten blijven in `report.candidates` zichtbaar.
- Na een nieuw bronrecord blijven `coalesceKey` en `triggerFingerprint` stabiel; `sourceCandidateCount` en `sourceIdentityDigest` veranderen, zonder extra werkregel.
- Test: `tests/brain-completion-supervisor-backfill.test.mjs`.

## Vrijgave en onafhankelijke acceptatie
Een bronpatch, skillupdate, CI, groen cronresultaat of nieuw dispatchrecord alleen is niet end-to-end groen. Eerst exact-head Required/Powerhouse CodeQL/BRAIN relevante checks, daarna beschermde merge naar `main`, Netlify READY met exacte commit-SHA, daarna originele natuurlijke `Completion Supervisor Backfill Resume` en duurzame source/replaycontrole. Onafhankelijke eigenaar/consumer moet vervolgens echte item-voor-item voortgang tonen; de oude 3k+ backlog wordt niet gewist. Bij ontbrekend bewijs blijft P0 #4198 open met oorspronkelijke owner, fingerprint, next safe action en regressie. Geen ongeautoriseerde side effects.
