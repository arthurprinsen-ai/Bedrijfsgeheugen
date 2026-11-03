# CRO → commerciële uitkomst → ONE BRAIN: bewijsvaste Heartbeat-reconciliatie
**Datum:** 30 oktober 2026
**Incident:** `powerhouse|cro|growth-brain-queue-delivery-disabled-and-unproven-conversion|20261030-v1`
**Owner:** bestaande Growth/SEO, commerciële Heartbeat #116 en ONE BRAIN. Dit is één *recovery-candidate*, geen nieuwe executor.

## Productiebevinding (onafhankelijke Supabase-leescontrole)
- `growth_brain_queue`: 199.325 `QUEUED` events; daarvan 189.878 met `delivery-disabled`; 26.356 `BLOCKED` robot-events. Geen van deze aantallen bewijst verloren klantdata of rechtvaardigt bulk replay.
- `powerhouse_cro_conversion_evidence_v1`: 0 echte gekwalificeerde lead-recordkoppelingen en 0 records met betalingsprovider-readback in de laatste 30 dagen.
- `powerhouse_cro_experiment_evidence_v1`: één treatment, nul volwassen holdouts; `INSUFFICIENT_MATURED_ASSIGNMENTS`. Eén assignment is geen A/B-testresultaat.
- `brain_failure_registry` registreert deze waarneming als `OBSERVED`; `brain_records` heeft de idempotente notitie `growth-cro-commercial-proof:2026-10-30` met `verified=false`.

## Concrete broncorrectie
De oorspronkelijke `tools/growth-intelligence/heartbeat-adapter.mjs` produceert nu optioneel `croCommercialProof` met zeven expliciete gates, aangeleverd uit de **bestaande** Supabase- en provider-readbacks. Het contract is strikt: zonder snapshot `NOT_ASSESSED`; zonder bronbewijs `EVIDENCE_INCOMPLETE`; zelfs met alle doorgegeven positieve attestaties maximaal `EVIDENCE_COMPLETE_REQUIRES_INDEPENDENT_AUDIT`. Niet automatisch mergen, niet automatisch promoveren naar echte omzet. Als data ontbreken verschijnt een `croRecoveryProposals` voor de oorspronkelijke owner met `PROPOSED_NOT_EXECUTED` en `noProviderSideEffect=true`.

De code doet géén write, provider-call of scheduling. De enige source of truth blijft ONE BRAIN, met de bestaande `growth_events`, `growth_outcomes`, `commercial_leads`, `powerhouse_experiment_assignments` en providerreadback.

## Verificatie en resterende uitvoering
1. Draai `node --test tools/growth-intelligence/heartbeat-adapter.test.mjs tests/brain-growth-intelligence-delivery-closure.test.mjs` en de protected Required/BRAIN/CodeQL contracten. Alle tests moeten op de exacte PR-head slagen.
2. Laat de bestaande Heartbeat-owner de brondata uit de service-role-only CRO-readmodellen aan `croCommercialProof` doorgeven. Alleen geauthenticeerde, geaggregeerde data; geen browser-token of user-PII. Dit is **nog niet bewezen** door een codehelper.
3. Herstel de bestaande Growth→Brain-afleverroute of schrijfpad binnen de bestaande owner, met een beperkte test op één bestaand bron-ID en onafhankelijke Brain-readback. Niet `BG211_DELIVERY_ENABLED=true` zetten en 189.878 records massaal versturen.
4. Pas CRO-behandeling alleen toe met vooraf geregistreerde random assignment, control, consent, bron-ACK, volwassen outcomes, en een beschermde livegang.
5. Een `qualified_lead` is pas bevestigd via geldig vrijwillig contact en verificatie; een betaalde order via factuur/contract en onafhankelijk providerbewijs. `learning_applied` alleen na echte readback in ONE BRAIN en de volgende natuurlijke run.
6. Na merge: productie-Edge/Netlify en Heartbeat readback plus `Data & intelligence → Andere data` controleren. Geen `LIVE/GREEN` op basis van dit document of een geslaagde helpertest.

**Rollback:** revert alleen dit contract via beveiligde PR. Historische queue-items, consentvlaggen en bewijsregistraties blijven intact.
