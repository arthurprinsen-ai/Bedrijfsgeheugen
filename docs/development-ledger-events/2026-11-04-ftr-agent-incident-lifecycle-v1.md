# 4 november 2026 — aanvullend FTR agentbeleid, skillbewijs en incidentlog

## Canonieke gebeurtenis en eigenaar
Originele ONE BRAIN-incidentregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Oorspronkelijke owner: ONE BRAIN incident/engineering/recovery, met dezelfde writer/lease; geen parallelle publisher/scheduler of nieuw incidentregister.

## Reeds objectief geverifieerd
First Time Right bronnen en admission beschermd gemerged via PRs #5392, #5393 en #5398. Oorspronkelijke GitHub-native negatieve uitvoering 41797450956 weigerde dubbele declaratie `revisionInput` vóór de build als `FIRST_TIME_RIGHT_PREBUILD_BLOCKED`; positieve reparatie 41797567508 binnen dezelfde niet-gemergede PR #5397 werd `ADMITTED`. Eén gecontroleerde synthetische fout is door de bestaande `public.brain_observe_failure` geschreven en onafhankelijk teruggelezen in `public.brain_failure_occurrences`. Die ene directe canonical write is **geen bewijs** dat iedere toekomstige GitHub- of providerfout automatisch wordt opgenomen.

## Aanvullende preventie, First Time Right vóór iedere actie
Bestaand centraal `brain/policies/powerhouse-incident-register-and-self-fix-v1.json` (zelfde protocol, revisie 7), `AGENTS.md`, originele delivery- en recovery-skills verplichten:
- bron en acceptatiecriteria, originele exclusieve owner/lease, security/privacy/toestemming, quota, idempotentie, test, rollback en meetplan **vóór** een actie.
- registreer ook near misses en afgewezen kandidaatcode met gedateerde bron-SHA, agent/skillversie, stabiele fingerprint, oorzaak of UNKNOWN, oorspronkelijke eigenaar, correctie, preventie, regressie en werkelijk productieresultaat.
- sluit alleen op onafhankelijke originele productieprovider-/klantbewijs, learnings en herhalingscontrole; CI succes, triage of gepland bericht is niet voldoende.
- als bronregistratie ontbreekt, toon `INCIDENT_LOG_WRITEBACK_UNVERIFIED`; als automatische broninventaris ongecontroleerd is, `SOURCE_COVERAGE_UNVERIFIED`. Synthetische testevents nooit meetellen als echte productiestoring.

## Wijzigingsbewijs en terminale opvolging
Dit pakket: centrale policy+AGENTS+2 bestaande skills, machine-readable ONE BRAIN learning, regressietest `tests/brain-first-time-right-agent-incident-lifecycle-20261104.test.mjs`, append-only menselijke activiteitenregistratie. Alleen beschermd mergecommit, teststatus en onafhankelijke main-bronreadback zullen deze **policy/skill** update live bewijzen. Automatische toekomstige GitHub→Brain ingestion en alle overige providerresultaten blijven apart OPEN totdat de oorspronkelijke bron dit met een natuurlijke uitvoering en onafhankelijk readback bewijst.

**Niet uitvoeren:** rechten omzeilen, service_role in onbewezen PR-context injecteren, parallelle jobs/registraties maken, 23+ bestaande incidenten automatisch groen zetten, bloggoedkeuring of Mira identiteit verlagen.
