# 2 november 2026 — PostgREST-telemetrie geeft terecht 503, oude regressietest eist 202

## Onafhankelijke foutobservatie
De oorspronkelijke volledige BRAIN-run [41416918147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41416918147), backend-job 125183392982, heeft 5.377 tests uitgevoerd, 5.347 geslaagd en 28 mislukt. De originele test `tests/brain-supabase-runtime-pressure-v1.test.mjs` bevat een verouderde check `status: 202` voor de test 'interaction telemetry cannot amplify a PostgREST outage'. In de originele beveiligde `supabase/functions/bg-interactie/index.ts` schrijft `degradedResponse` bij uitval terecht `status: 503` en de JSON-inhoud `ok:false, opgeslagen:0, bevestigd:0, degraded:true`.

## Waarom geen 202
HTTP 202 communiceert geaccepteerde verwerking, maar een tijdelijk onbereikbare bron levert geen opslagbewijs. Door 503, `x-bg-telemetry-degraded:1`, `cache-control:no-store`, en een reden `DATA_API_CIRCUIT_OPEN` of `DATA_API_UNAVAILABLE` kan de ONE BRAIN-portal geen weggeschreven events of conversies verzinnen. De reeds geïmplementeerde PostgREST-fail-safe is een HTTP-timeout van 2,5 seconden en een circuit-breaker van 30 seconden. Oorspronkelijke controle sluit positieve realisatie zonder provideropslag uit.

## Herstel en regressiepreventie
Behoud alle oorspronkelijke veiligheidstests; vervang alleen de verouderde `202`-assertion door controles op werkelijke 503, de exacte degradatierespons, nul geregistreerde events, de provider-foutredenen en negatieve 202-uitsluiting. Oorspronkelijke Edge-functie, auth, data, schema, uitgaande acties, provider, cron en portaaldata blijven ongemoeid. Centrale `AGENTS.md`, bestaande Continuity Skill, ONE BRAIN-regel met fingerprint `powerhouse|brain|telemetry-503-vs-stale-202-test|20261102-v1`, menselijke wijzigingsuitleg en append-only ontwikkellog horen bij één bronherstel.

## Bewijspoort
Beschermde Required-test, CodeQL, oorspronkelijke gerichte test, volledige exact-head BRAIN-run, terminal en onafhankelijke provider- en portalreadback moeten aantonen dat herstel werkt, anders blijft het incident OPEN. De resterende originele backendfouten worden niet verborgen en het herstellen van testcode is geen bewijs van meer leads, conversies of betaalde orders.
