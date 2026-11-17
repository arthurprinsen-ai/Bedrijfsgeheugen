# 17 november 2026 — Incidenten leren en oplossen door oorspronkelijke agents

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

**Fingerprint:** `powerhouse|all-agents|repaired-incident-without-independent-learning-application|20261117-v1`

**Waarneming:** read-only `reconcileIncidentObligations` accepteerde zelfbevestigde `VERIFIED` + `prevention_applied=true` + `skill_version` zonder daadwerkelijk aangetoonde oorspronkelijke ontvangende consumer `PROCESSED`, exacte bronversie en later uitvoeringsbewijs. Status van alle incidenten kan hierdoor te optimistisch worden getoond; géén bewijs van een concrete vals gesloten productie-incident zonder bronspecifieke readback.

**Impact:** agent-overdrachten en incidentleerbewijzen kunnen ten onrechte als afgerond worden beschouwd. Laat 422 open CONTENT_HANDOFF en 14 open INNOVATION_DELIVERY ongemoeid; nooit bulkafsluiten of historische echte occurrences wijzigen.

**Herstelkandidaat:** bestaande incident audit vereist brongebonden onafhankelijke consumer-leerreceipt, later next-run bewijs, root cause, regressie, preventie, rapportage en skillversie. Originele 14 agent-registraties erven gelijke taken, zelfde skills geactualiseerd. Geen parallelle scheduler, writer, router of ontvanger.

**Veiligheids-/regressiecontrole:** node --test tests/brain-incident-learning-all-agent-closure-20261117.test.mjs tests/brain-incident-register-self-fix-preflight-20261029.test.mjs

**Open vervolg:** exacte PR Required/CodeQL, protected merge, actuele Netlify-/agent-registerbron, oorspronkelijke ONE BRAIN incident- en consumer-readbacks en eerste echte natuurlijke toegepaste-les-/recurrence-run. Tot dan CODE CANDIDATE, geen liveclaim.
