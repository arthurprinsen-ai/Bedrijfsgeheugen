# Powerhouse Agent Intelligence — één gesloten, bewijsbare verbetercyclus

Status: **read-only portal UI kandidaat op een aparte branch**. Geen productieclaim, geen nieuwe scheduler, geen nieuwe bron van waarheid.

## 1. Plaats in het bestaande systeem

- URL na beschermde release: \`https://www.bedrijfsgeheugen.nl/portal-v2/?page=powerhouse-control-center\` → tab **Verbeterintelligentie**.
- Server-to-server: bestaande \`/api/powerhouse-observability\`, uitsluitend Netlify Identity / \`isPowerhouseAdmin\`; geen browser-query op operationele Supabase-tabellen.
- Operationele waarheid: bestaande \`brain/operating-loop\`, \`brain_failure_registry\`, \`brain_failure_occurrences\`, \`powerhouse_decision_cycles\`, \`powerhouse_cycle_events\`, \`powerhouse_optimization_candidate_v1\`, \`powerhouse_forecast_calibration\`, \`powerhouse_experiment_policies\`, \`brain_value_evaluations\` en terminal delivery-evidence. Geen dubbele errorstore.
- Klantwaarheid: bestaande, tenant-geïsoleerde \`agentstatus\`, \`learning-writeback\` en \`outcomes-evidence\` routes. Geen interne GitHub-, Netlify- of Notion-beheerrecords zichtbaar in klant-API.
- Deze UI meet **Brain-eventvermeldingen** van providers; dit is niet hetzelfde als een actuele onafhankelijke provider-readback. Ontbrekende gegevens blijven onbekend.

## 2. Vier bronadapters — voorgesteld uitbreidingscontract

Normaliseer bronsignalen via de *bestaande* ingest/heartbeat en bestaande evidence-objecten; voeg geen tweede heartbeat of los analytics-schema toe. Gebruik provider-native webhooks waar betrouwbaar, aangevuld met begrensde reconciliatie via de bestaande scheduler.

| Bron | Te verzamelen velden | Primair bewijs |
|---|---|---|
| GitHub | PR, SHA, run-ID, queued/started/completed, checks, duur, testdiff, merge, rollback, CodeQL, required checks | GitHub Actions REST/status met exact commit SHA |
| Supabase | migrations op main/preview, cron execution, errors, querylatentie, pg_net-resultaat, replicatie/versheid, forecast-calibration | Production/preview schema parity en onafhankelijke DB-readback |
| Netlify | deploy-ID, context, state, commit_ref, buildtijd, function errors, user route readback, Web Vitals | Provider-ready mét exact SHA én aparte route/functional browser-readback |
| Notion | canonieke system-map versie, leerregels, agentacties, handboek, besluit & skill-release, readback-tijdstempel | Canonical Notion page/database ID, revision, teruggelezen content |

Genormaliseerd eventcontract: \`{source, sourceEventId, observedAt, receivedAt, component, tenantScope, correlationId, lineageId, fingerprint?, authority, revisionOrSha?, assertionType, status, evidenceRefs[], freshnessTtlSec, schemaVersion, producer}\`. Alleen server-side tokenuitwisseling; secrets nooit loggen. Append-only bronfeiten, idempotent via \`source + sourceEventId\`. Afgeleide conclusies in bestaande projecties met \`computedAt\`, \`sourceEvidenceIds\` en \`policyVersion\`.

## 3. Denk- en besluitmodellen die agents samen laten leren

**A. Causale bedrijfsverbetering:** nulmeting → voorstel → kleinste veilige wijziging → holdout/A-B waar toegestaan → onafhankelijke uitkomst op afgesproken horizon → behouden/rollback → geleerde regel naar bestaande skill, decision, incident en Notion. Geen conversielift of euro-ROI als klikfrequentie de enige observatie is.

**B. Incidentpreventie:** groepeer op bestaande fingerprints en root cause; detecteer herhaling over functies/agents heen. Verwerk bij herhaling dezelfde canonieke lineage, niet een tweede ticket. Release pas na regressie, provider-checks en productie-readback.

**C. Multi-agent bijdrage en samenwerking:** \`plan → owner agent → reviewer agent → safety/evaluator → executor → verifier\`. Elke stap deelt dezelfde evidenceRefs en correlationId. Meet samenwerking via aantoonbare hand-offs en geaccepteerde correcties; tel niet slechts agentnamen als teamwork.

**D. Verantwoord prioriteren:** kies kandidaat \`expected incremental value × evidence confidence × urgency / (engineering time + variable cost + risk budget)\` **alleen** als alle inputs gemeten en vergelijkbaar zijn. Ontbrekende waardes: \`INSUFFICIENT_EVIDENCE\` en onderzoekstaak, nooit synthetisch 0/100.

**E. Zelfverbetering met begrenzingen:** testen van nieuwe modellen/technieken in schaduwmodus; kleine traffic-canary na security/privacy/quality-budget-acceptatie; automatische terugval bij fout of cost-regressie. Geen autonome rechtenescalatie, geheime key-rotatie buiten geautoriseerde route, verplichte CI omzeiling of onbeschermde productie-merge.

## 4. Eigenaarschap en dagelijkse cyclus

Herbruik bestaande Powerhouse/Brain/Heartbeat-agenten in plaats van duplicaten:

1. **Observeer:** bronversheid, terminal checkstatus, uitkomst, agenttrace, klantimpact en prestatie-drift. Markeer \`UNKNOWN\` bij ontbrekende bronauthority.
2. **Interpreteer:** vergelijk met rolling baseline en seizoenseffect; detecteer afwijkingen op KPI's en fouten met minimale steekproefgrootte.
3. **Plan:** candidate record in \`powerhouse_optimization_candidate_v1\`, gekoppeld aan businessdoel, eigenaar, verwacht resultaat, risico, terugvalplan en fingerprint.
4. **Actie:** risicoloze reversibele aanpassingen alleen binnen bestaande consent- en autorisatiegrenzen; code via beschermde PR, native CI/CodeQL/Supabase-preview/Netlify-deploy.
5. **Bewijs:** onafhankelijke observatie exact op main/production-SHA, de benodigde bedrijfsuitkomst en feedback. Geen groen als signalen ontbreken of verouderd zijn.
6. **Leer:** schrijf bewijs, regressie, impact, les en skill-projectie terug naar bestaande canonieke laag en relevante Notion human-readable documentatie.
7. **Verifieer morgen opnieuw:** automatische kwaliteitscontrole via bestaande heartbeat-cadans, inclusief rollback-signalen en dataretentie.

## 5. Wat de tab daadwerkelijk toont in deze eerste codewijziging

- 14-daags event-/foutsignaalgrafiekje; foutstatusratio huidige en voorgaande 7 dagen.
- Brain-evidence-vermeldingen voor GitHub, Supabase, Netlify en Notion, aantallen gekoppelde bewijslinks en laatste waarneming.
- Agentactiviteit per actor; aantal fout-, leer- en statusbevestigingssignalen.
- Herhaalde foutfingerprints met veilige herstelhypothese.
- Telling van afgeronde looprecords en gerealiseerde waarde **uitsluitend wanneer de bestaande projectie een getal heeft**.
- Disclaimer: dit is nog geen onafhankelijke provider-connectordekking of bewezen bedrijfsverbetering.

## 6. Acceptatiecriteria voor de volgende versies

1. Vier provider-adapters hebben elk een independent readback met bronidentiteit, SHA/revision, deadline, auth, idempotente ingest en matching read-only telemetry.
2. Zichtbare grafiek maakt onderscheid tussen observed / inferred / verified / realized, met bron en verversdatum.
3. Relevante trace is tenant-scoped; multi-tenant authorization-/BOLA- en privacytesten slagen.
4. Bereken delivery lead time, change failure rate, rework, MTTR, error recurrence, forecast Brier score, A/B-uplift, skill adoption, kosten en klantwaarde met vooraf vastgelegde noemers. Onvoldoende data = \`UNKNOWN\`.
5. Minimaal één gecontroleerd A/B- of rollbackproces is echt uitgevoerd en daarna onafhankelijk teruggelezen, zonder extra scheduler.
6. Vereiste CI, CodeQL, native database-preview, migratiepariteit, Netlify-productie-ID en functionele acceptatie zijn geslaagd voordat de wijziging LIVE_BEWEZEN krijgt.

Onder meer OpenTelemetry GenAI semantic conventions kunnen helpen bij agent/tool traces; hun schema is nog in ontwikkeling, dus versieer de attributen en vermijd standaard full prompt/PII logging. Zie https://opentelemetry.io/docs/specs/semconv/gen-ai/ .
