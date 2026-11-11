# 2026-11-11 — Portal → CRO autonome keuze en ontvangstbewijs

Original P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Related commercial P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Fingerprint: `portal|cro|source-verified-autonomous-decision-receipt|20261111-v1`

## Wat verandert
De bestaande 14 Agent Fabric-specialisten blijven ongewijzigd in aantal. Binnen `platform/agents/agent-team.mjs` krijgen de bestaande Growth/Market, Website/UX en Reliability-specialisten concrete verificatie- en keuzeverplichtingen. In de oorspronkelijke SEO/CRO-skill wordt uitgewerkt wanneer de originele CRO-eigenaar veilig autonoom één omkeerbare test mag kiezen en door de beschermde originele releaseketen mag laten uitvoeren. Geen tweede cron, writer, engine, klantregister, publisher of entitlement.

## Ontvangstcontract
Na een echte geautoriseerde klantwijziging: originele portal-state server-GET → actuele sourceRevision → originele tenantgebonden BusinessInput-ACK → corresponderende afhankelijke pagina of REVIEW_REQUIRED → Powerhouse/CRO-ontvanger → Heartbeat-receipt → geautoriseerde protected release → onafhankelijke provider- en treatment/holdout-observatie → ONE BRAIN-les → latere natuurlijke toepassing. Elke stage houdt dezelfde tenant/correlation/experiment-ID; 2xx/CI/browser-success is nooit gelijk aan resultaat. Retry binnen originele lease; originele blokkade blijft OPEN met herstelreden, owner en next action.

## Gecontroleerde bronstatus
Supabase project `adhjwmvyoixzjtmiroln` op 11 november 2026 circa 08:58 UTC:
- `powerhouse_autonomous_experiment_readiness_v1`: LATENT_WAITING_FOR_ELIGIBLE_ACTION, 0 assignments, 0 treatment, 0 holdout.
- `powerhouse_optimization_candidate_v1`: 14 kandidaatrecords; `powerhouse_optimization_closure_truth_v1`: 14 REVIEW_REQUIRED.
- `powerhouse_cro_experiment_evidence_v1`: INSUFFICIENT_MATURED_ASSIGNMENTS.

Dit zijn echte bronwaarnemingen; zij **autoriseren geen automatische massapromotie**. De originele eigenaar moet eerst per kandidaat de actuele relevantie, veilige toestemming, baseline, meetinrichting, lease en rollback bewijzen.

## Acceptatiegrens
Dit is **agentconfiguratie + skillbeleid + regressie**, geen nieuwe CRO-uitvoerder of live experiment. De enige bron van waarheid blijft de originele BRAIN/CRO-Supabase-loop. Eerst beschermde exacte-head tests, CodeQL, merge en skill/readback; vervolgens echte geauthenticeerde twee-tenant-doorwerking, originele toegewezen behandeling/holdout, providerresultaat en leer-hergebruik. Tot die tijd originele #4215 OPEN en CRO EVIDENCE_DUE. Echte handmatige OAuth/financiële/onomkeerbare toestemming wordt niet omzeild.
