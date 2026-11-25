# ONE BRAIN / Heartbeat: onderscheid tussen onderzoek en bewezen herstel

Datum: 4 november 2026. Eigenaar: originele Powerhouse recovery queue / ONE BRAIN reliability agent. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Herstelvoorstel: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5381.

## Situatie
De bestaande herstelqueue bewaart 307 cron-failure reviews met taakstatus `succeeded`, maar 306 dragen expliciet `UNRESOLVED` in zowel bron/triagevelden. Dit is geen tegenstrijdigheid in de database: de **review** is afgerond, het oorspronkelijke probleem/ontbrekende providerresultaat niet. Agents/portaal mogen de 307 taakrecords niet als 307 daadwerkelijk opgeloste fouten tellen.

## Oorzaak en veilige reparatie
De oorspronkelijke `public.powerhouse_recovery_control_plane_tick_v1()` voert onder zijn bestaande exclusieve advisory transaction lease de execution-resilience watchdog en reconciliation worker uit en meldt `ok=true` als deze taakronde loopt. De return bevat nog geen afzonderlijke bronwaarheid over reviewstatus versus externe hersteluitkomst.

PR #5381 voegt een geaggregeerde, service-role-only en read-only `public.powerhouse_recovery_review_truth_v1()` toe en laat de **bestaande** control-plane tick die uitslag teruggeven via `recovery_review_truth`. Het oude `ok` blijft uitvoeringstatus, `recovery_provider_resolution_proven=false` verhindert verwarring. Geen nieuwe planner, agent, queue, netwerkactie, publicatie, blind replay of extra publieke databaseprivileges. Privérijen en foutdetails blijven onzichtbaar; alleen aantallen en een route voor de oorspronkelijke eigenaar worden teruggegeven.

## Autonome bedrijfsbreinlus
Waarneming → fingerprint en oorspronkelijke eigenaar → bronanalyse en testbare hypothese → veilig experimenteerpad (controlegroep/baseline, omkeerbare wijziging, metric en guardrail) → originele exclusieve writer/lease → regressie en beveiligde PR → eigen productieproviderdeploy en functie/ACL-readback → natuurlijke Heartbeat-run → echte externe provider-/klantuitkomst → meting en evaluatie → originele Brain/skill/portaal preventie → incidentele CAS-closure. Niet elk experiment vereist externe klantactie. Geen echte provider- of omzetclaim uit alleen bronmetingen.

## Belangrijk onderscheid
De 306 historische onopgeloste uitkomsten blijven individueel open totdat hun oorspronkelijke provider/job-resultaat onafhankelijk bewezen is of veilig geclassificeerd als zonder replay te herstellen. Een broncodefix en een geslaagde cron bewijzen hun oorspronkelijke side effects niet. Onbekend blijft onbekend. Wanneer expliciete OAuth-toestemming, billinggegevens of extra kosten nodig zijn, moet de bestaande eigenaar een actie-e-mail sturen met een geverifieerde volledige HTTPS-URL en daarna herstelreadback uitvoeren.

## Vrijgave
Verplicht: regressie `tests/brain-original-recovery-queue-triage-outcome-proof-20261104.test.mjs`; originele BRAIN/Required/CodeQL/Supabase Preview; lease-validatie; protected merge; originele productie-ACL en functiedefinitie; eerstvolgende natuurlijke recovery-tick met echte `recovery_review_truth`. Geen groen of live vóór deze controles. De gebruiker profiteert pas van gemeten en onafhankelijk geverifieerde verbetering.
