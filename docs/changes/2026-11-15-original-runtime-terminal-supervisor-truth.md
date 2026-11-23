# 2026-11-15 — één terminale waarheid bij originele ONE BRAIN uitvoeringsstatus

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bronfout

De oorspronkelijke `evaluateOutcomeObligation` beoordeelde slechts de aanwezigheid van een onafhankelijk gemarkeerd observatiebewijs. Een enkele `outcome`-rij of een generieke `exactProduction`-flag kon `status=COMPLETED` opleveren. In dezelfde `createOutcomeObligationRuntime.evaluateOne` beoordeelde `evaluateCompletion` de werkelijk vereiste onafhankelijke zeven bewijstypen en kon tegelijkertijd `supervision.success=false` / `OBLIGATIONS_COMPLETE` ontbrekend teruggeven. Dit is aantoonbare tegenstrijdigheid in runtime-broncode en negatieve regressie, **niet** bewijs dat een echte provideruitkomst onjuist was.

## Afgrenzen in plaats van een parallelle keten

De oorspronkelijke runtime blijft dezelfde eigenaar, geen migratie/queue/cron. Alleen bij deze tegenstelling wordt de weergegeven `status` `AWAITING_OUTCOME` en `terminalEvidenceDue=true`. Een `COMPLETED`-status blijft mogelijk **alleen** wanneer de reeds bestaande Completion Supervisor werkelijk `success=true` beoordeelt. De oorspronkelijke `SUPERVISOR_DECISION` met vereiste bewijstypen, run-identiteit, origineel werk, eigenaar en onafhankelijk resultaat blijven de enige waarheid.

Dezelfde bestaande Reliability- en Data Quality-agents krijgen een afdwingbare taak; de oorspronkelijke Powerhouse-recovery-proof-skill beschrijft grens en herstel. Geen provider-replay, externe financiële actie, wijziging van consent, historisch overschrijven of status-"reparatie".

## Test en onafhankelijke release

`tests/brain-outcome-obligation-runtime.test.mjs` heeft twee niet-terminale negatiefgevallen (een willekeurig onafhankelijk `outcome` en `exactProduction` zonder brongebonden material readback), plus positieve regressie met volledige vertrouwde zeven bewijsbronnen. De originele backfill/runtime-stores en het oorspronkelijke P0 blijven behouden. Required/BRAIN/CodeQL actuele exact-head, beschermde main-merge, originele natuurlijke `Completion Supervisor Backfill Resume` en onafhankelijk teruggelezen status-/consumer-/providerbewijs bepalen succes.

## Expliciete open punten

De wijziging voorkomt **false-green uitvoeringsclaims**. Ze verwerkt de duizenden onveranderlijke `AgentWork/PENDING` en `RecoveryWork/RECOVERING` bronrijen niet automatisch; zelfstandige uitvoering en afhankelijke echte zakelijke uitkomst blijven EVIDENCE_DUE en P0 #4198 OPEN tot oorspronkelijk bewijs.
