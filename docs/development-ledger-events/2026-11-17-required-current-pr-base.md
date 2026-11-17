# 17 november 2026 — Required PR base-bronrevisie fout en herstelkandidaat
Fingerprint: delivery|required|stale-pr-event-base-scope-contamination|20261117-v1
Eigenaar: bestaande Required workflow en BG169; parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

GitHub provider bewijs: #5934 17-nov Required run 44048420630 failed Branch hygiene SCOPE_BUDGET_EXCEEDED 10 versus 6; vergelijking vertrok van oude event base 8411f99e terwijl branch al latere main bevatte. Rerun 44049230571 bevestigde dezelfde oorzaak. De branche bleek zelf zes bedoelde gewijzigde paden te hebben (vergelijking actuele main).

Fix als CODE CANDIDATE: valideer actuele live GitHub PR identity en base SHA vóór de reeds bestaande provider-verified merge-base vergelijking. Nooit oprekken van Scope-Budget, label-bypass, force-push, nieuwe scheduler of alternatieve CI uitvoerder.
Regressie: tests/brain-required-live-pr-base-reconciliation-20261117.test.mjs en oorspronkelijke delivery-branch-hygiene tests.
Geen afronding voordat exact-HEAD Required, CodeQL, beschermd merge, natuurlijke follow-up PR run en ONE BRAIN originele handoff-evidence bevestigd zijn.
