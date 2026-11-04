# 4 november 2026 — First Time Right: één incidentregistratie en aantoonbare afsluiting voor alle agents

## Aanleiding
De oorspronkelijke GitHub First Time Right-gate is beschermd geïmplementeerd en live getest: native negatieve broncontrole blokkeerde een dubbele `revisionInput` vóór de build (run 41797450956), en dezelfde gerepareerde testkandidaat werd toegelaten (run 41797567508). De oorspronkelijke ONE BRAIN-ingestfunctie `public.brain_observe_failure` registreerde die gecontroleerde synthetische canary precies eenmaal; een onafhankelijke `public.brain_failure_occurrences`-readback bevestigde dit. Die expliciete eenmalige write bewijst nog **niet** dat elke toekomstige GitHub/providerfout automatisch in ONE BRAIN aankomt.

## Geconstateerde ontbrekende structurele garantie
De bestaande voorwaarden verspreid over AGENTS/skills en het incidentregister moeten hetzelfde onderscheid afdwingen tussen broncontrole, geslaagde tests, deploy, echte provideractie en onafhankelijk klantresultaat. Anders kan een agent een geslaagde GitHub-run, afgeronde triage of leeg meetregister als 'alles groen' uitleggen. Dat veroorzaakt onzichtbare fouten en herhaling.

## Wat de oorspronkelijke agents nu als beleid krijgen
Het bestaande `brain/policies/powerhouse-incident-register-and-self-fix-v1.json` is uitgebreid (revisie 7), niet vervangen. `AGENTS.md`, de bestaande delivery-skill en recovery-skill hebben dezelfde volgende verplichte eisen:
1. **Vóór bouwen:** unieke oorspronkelijke owner/writer, gedateerd bronbewijs, relevante vorige incidenten, acceptatie, security/privacy/providerconsent, afhankelijkheden, kosten/quotum, idempotentie, regresstest, rollback en meetbare externe resultaatdefinitie. Ontbreekt een harde voorwaarde, registreer `BLOCKED_BEFORE_BUILD` en onderneem geen ongeautoriseerde actie.
2. **Bij elke gebeurtenis:** log fout, incident, near miss, afgewezen kandidaat of ontbrekend bewijs met exact moment, bron, SHA/provider-ID, unieke fingerprint, agent/skill, oorzaak of `UNKNOWN`, correctie, preventieregel, regressie en menselijke uitleg. Gebruik de bestaande `brain_observe_failure` en verifieer de werkelijk opgeslagen occurrence; nooit een parallel foutregister.
3. **Na herstel:** laat alleen `RESOLVED` toe na beveiligde merge, echte productiecontrole, oorspronkelijke natuurlijke uitvoering, onafhankelijke provider-/klantuitkomst, leren én een herhalingscontrole. Triage of CI-succes alleen telt niet.
4. **Eerlijke dekking:** de geverifieerde test krijgt `is_synthetic=true`, geen productie-incident of omzetresultaat. Bij ontbrekende automatische GitHub→Brain-ingest blijft `SOURCE_COVERAGE_UNVERIFIED`/ `INCIDENT_LOG_WRITEBACK_UNVERIFIED` zichtbaar. Geen extra scheduler of service_role-secret in onbetrouwbare PR-runs.

## Incident vóór deze release: bestaande poort werkt
De **eerste** beschermde PR-check (run 41800337962) wees dit pakket af met `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:human_documentation`. Oorzaak: wel een append-only technisch ontwikkellog onder `docs/development-ledger-events/`, maar nog geen afzonderlijke menselijke changenotitie onder `docs/changes/`. Dezelfde oorspronkelijke PR bevat nu ook deze notitie. Die wijziging geldt als concrete First Time Right-leerregel voor toekomstige agents: **iedere materiële beleidswijziging bevat zowel technisch log als menselijke documentatie vóór merge**.

## Proof en nog open
Gerichte test: `tests/brain-first-time-right-agent-incident-lifecycle-20261104.test.mjs`; nieuw ONE BRAIN-leerrecord `brain/learning/2026-11-04-ftr-agent-incident-lifecycle-gap-v1.json`. De originele Required/BRAIN/CodeQL, originele writer-lease, beschermde merge en onafhankelijke bronreadback bewijzen deze policy release. Automatische log-ingest uit alle toekomstige kanalen blijft een aparte onbewezen herstelverplichting en mag niet stilzwijgend groen worden gemaakt. Overige providerblokkades blijven bij hun oorspronkelijke owners.

Centrale incidentregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
