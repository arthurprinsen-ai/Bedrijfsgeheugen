# Ontwikkelingslogboek — Portal Voice → originele Heartbeat v2

Datum: 2026-11-20
Obligation-ID: portal-v2-voice-heartbeat-closure-v2
Delivery-Lane: portal
Candidate-Type: implementation
Owner: oorspronkelijke Portal V2 en Powerhouse/Heartbeat, ouder #4547
Prior release: #6082
Status: SOURCE_CANDIDATE, PRODUCTION_AND_PROVIDER_EVIDENCE_DUE

## Vaststelling
Vorige release #6082 publiceerde de veilige eerste UI, maar inspectie van de bestaande Supabase-projectstatus vond uitsluitend één legacy-migration-record in `portal_state_layers` en **nul opgeslagen rules** in deze tabel. Reeds bestaande cron 171 en commercial-heartbeat-runner kunnen daarom geen daadwerkelijke klant-afwijkingsmelding uit deze data bewijzen; beloof geen actieve klantnotificaties.

De originele Netlify/portal-state-gateway gebruikt tenantafleiding uit Netlify Identity en schrijft EU-projecties via de bestaande servicegate. De originele vijfminuten Heartbeat is `powerhouse-commercial-heartbeat-runner`, uitdrukkelijk niet vervangen of gedupliceerd.

## Uitvoering
- Nieuwe expliciete native spraak-command-policy, veilig zonder universele providerklik.
- `monitoring` en gewenste `email/push`-booleans in oorspronkelijke signaleringsregels, met status nooit `sent` uit browserstate.
- Gebonden native Heartbeat-observer: alleen geautoriseerde portal_state_layers-bronrijen, beperkte batches, idempotent gehashte tenant-/regelkeys, readback en `OBSERVED`-semantiek.
- Originele skills en vijf bestaande specialistische agents aangepast; contracttests toegevoegd.
- Documentatie, leerregel en partner-/release-evidence blijven één lineage.

## Verificatie en blockers
- GitHub protected Required, CodeQL, exact Netlify SHA en live Edge function: EVIDENCE_DUE totdat werkelijk uitgelezen.
- Natuurlijke vijfminutenrun met geautoriseerde tenant, bronrevisie en overeenkomende `powerhouse_runtime_events`: EVIDENCE_DUE.
- Aparte e-mail-/push-provider, echte ontvangeropt-in, bezorging, autonome beschermde actie en Heartbeat-resultaat: NOT_DELIVERED. Deze worden nooit automatisch groen op basis van een geslaagde codecompile.
- Geen los cron-, queue-, customer store- of mailmarketing-circuit introduceren om een dummybericht te verzenden.
