# 17 november 2026 — alle oorspronkelijke 14 innovaties koppelen aan hun oorspronkelijke kwaliteitsbron

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Voorganger: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5941 (historische geslaagde Required en CodeQL, maar verouderde branch en workflow)

## Onafhankelijk geobserveerd probleem
Native Supabase: 14 originele kandidaten, 14 PLANNED `INNOVATION_INTAKE` en 14 OPEN `INNOVATION_DELIVERY`. Negen ervan zijn `bounded_learning_followup` en verwijzen naar negen feitelijk aanwezige records in `public.powerhouse_quality_events`. De kwalificatie `verified` of `guarded` op zo'n historisch bronrecord is **niet** hetzelfde als huidige productie- of klantimpact. De bestaande engineeringselector gaf 9 taken alleen een generieke baselineverplichting, zonder de bronkwaliteitsdata verantwoord in de oorspronkelijke operation-ID vast te leggen. `original_evidence_reconciliation` stond bij alle 14 leeg.

## Minimale correctie in dezelfde oorspronkelijke keten
Geporteerd uit de oorspronkelijke voorloper naar actuele protected main, **zonder** de verouderde volledige workflow te overschrijven: `scripts/brain/innovation-original-evidence-reconciliation.mjs`, brongetrouwe oorspronkelijke regressietest en de extra velden `baseline,expected_impact` op alleen de oorspronkelijke `innovation-original-owner-readback.mjs` source reader. Bij elke bestaande engineeringrun voert het oorspronkelijke `powerhouse-daily-self-evolution.yml` deze stap uit voordat de echte code-selector selecteert. **Er is geen tweede agent, scheduler, taakrij, RPC, datatabel of providerverzender.**

De reconciliatie controleert bron-ID, tenant, oorspronkelijke agent/owner, immutable source revision, action source SHA, dezelfde geregistreerde `brain_obligations` en `brain_operations`, en de exacte kwalitatieve fingerprint+component; geen losse zoekhits. Slechts de negen matches worden geaggregeerd, de historische ruwe performance-evidence wordt gehasht in plaats van gepubliceerd, en alle 14 oorspronkelijke operaties krijgen een niet-terminale genummerde CAS-bijschrijving via het bestaande RPC `brain_transition_operation`. Een onafhankelijke nieuwe GET controleert iedere oorspronkelijke update. Dezelfde fingerprint is idempotent op herhaling.

Om geen nieuw engineeringwerk uit te schakelen bij herstelbare bronproblemen is de bestaande reconciliation writeback met een gecontroleerd shell-resultaat (`reconciled=true/false`) en een afsluitende harde rode controle **na** de normale originele codegeneratie en beschermde PR-afhandeling. Een mislukte bronreconciliatie maakt de workflow rood; er wordt geen groen verslag of afgesloten innovatie verzonnen.

## Bewijs en oplevergrens
Het pakket bevat de oorspronkelijke historische replay, shadow/canary en originele skill-update. Protected exact-head Required en CodeQL moeten slagen; daarna volgt een echte originele workflowrun en onafhankelijke Supabase-GET op alle 14 operation identities. Pas dan is **bronoverdracht** bewezen, niet automatisch implementatie. Innovaties sluiten pas na daadwerkelijke originele build/no-change review, beveiligde merge/deploy, consumer PROCESSED, Heartbeat baseline/actual, waar relevant holdout, en toegepaste volgende leerregel.

Vermijd dubbele herhaling van al bewezen releases, waaronder website Design PR #5979 live main `3ed5bcd391f14f71ecab3fed5fdd8b6cdef5ff69`. Voor Instagram 17 november is nog geen Meta-resultaat, uitsluitend een geblokkeerde originele `WAITING_ASSET` mediajob. Leg onbekend effect als onbekend vast.
