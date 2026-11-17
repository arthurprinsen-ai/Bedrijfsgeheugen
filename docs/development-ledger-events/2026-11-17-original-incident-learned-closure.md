# 17 november 2026 — Incidenten leren en oplossen door oorspronkelijke agents

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

**Fingerprint:** `powerhouse|all-agents|repaired-incident-without-independent-learning-application|20261117-v1`

**Waarneming:** read-only `reconcileIncidentObligations` accepteerde zelfbevestigde `VERIFIED` + `prevention_applied=true` + `skill_version` zonder daadwerkelijk aangetoonde oorspronkelijke ontvangende consumer `PROCESSED`, exacte bronversie en later uitvoeringsbewijs. Status van alle incidenten kan hierdoor te optimistisch worden getoond; géén bewijs van een concrete vals gesloten productie-incident zonder bronspecifieke readback.

**Impact:** agent-overdrachten en incidentleerbewijzen kunnen ten onrechte als afgerond worden beschouwd. Laat 422 open CONTENT_HANDOFF en 14 open INNOVATION_DELIVERY ongemoeid; nooit bulkafsluiten of historische echte occurrences wijzigen.

**Herstelkandidaat:** bestaande incident audit vereist brongebonden onafhankelijke consumer-leerreceipt, later next-run bewijs, root cause, regressie, preventie, rapportage en skillversie. Originele 14 agent-registraties erven gelijke taken, zelfde skills geactualiseerd. Geen parallelle scheduler, writer, router of ontvanger.

**Veiligheids-/regressiecontrole:** node --test tests/brain-incident-learning-all-agent-closure-20261117.test.mjs tests/brain-incident-register-self-fix-preflight-20261029.test.mjs

**Open vervolg:** exacte PR Required/CodeQL, protected merge, actuele Netlify-/agent-registerbron, oorspronkelijke ONE BRAIN incident- en consumer-readbacks en eerste echte natuurlijke toegepaste-les-/recurrence-run. Tot dan CODE CANDIDATE, geen liveclaim.

## 17 november — GitHub PR event base is oudere snapshot, geen scope-uitbreiding

Exact-head protected run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44053134821 faalde preflight `SCOPE_BUDGET_EXCEEDED` 12 vs 7, hoewel native GitHub vergelijking van actuele `main` 4d29c3a407b2c9180615292996fee68e817b1086 naar branch 8e9a9500a77e9d30fe8119d1672a36d3ddc828d5 exact de oorspronkelijke zeven non-test bestanden + twee tests toont. De immutable GitHub Actions event had `PR_BASE_SHA=a3692b24a4ae3b2b1bf0656242a4db51b73c730b`, terwijl actuele PR base onafhankelijk naar 4d29c3a407b2c9180615292996fee68e817b1086 was bijgewerkt. De eerste herstelrun op oud event mag niet als scopebewijs gebruikt worden; de originele Required fail-closed guard bleef terecht actief. Nu na onafhankelijke native branch- en PR-base-readback een nieuwe bron-evidence-commit onder dezelfde oorspronkelijke PR maken om een nieuwe synchronize gebeurtenis te verkrijgen. Niet budget verhogen, geen veiligheidsfilter of beschermde merge omzeilen. Bij volgende fout oorspronkelijke incidentfingerprint blijven gebruiken en oorzaak als recurrence verwerken.
