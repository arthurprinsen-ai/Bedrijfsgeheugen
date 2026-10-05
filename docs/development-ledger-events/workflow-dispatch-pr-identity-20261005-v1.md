# Workflow dispatch PR identity — 5 oktober 2026

Obligation: `workflow-dispatch-pr-identity-20261005-v1`.

## Aanleiding

Tijdens recovery van PR #3741 faalde Required test in preflight omdat een `workflow_dispatch` run GitHub `run_id` als pull-requestnummer gebruikte. Daardoor werd `pulls/{run_id}` opgevraagd in plaats van de bedoelde PR.

## Uitvoering

De delivery event-normalisatie is aangepast zodat een recovery-dispatch alleen een expliciet meegegeven PR-nummer als PR-identiteit gebruikt. Wanneer dat nummer aanwezig is, worden ook de immutable PR base/head refs gebruikt. Zonder expliciete PR-identiteit blijft `prNumber` leeg in plaats van een run-id te fabriceren.

## Regressie

`tests/delivery-github-event-context.test.mjs` bewijst zowel de expliciete-PR dispatch als de fail-closed no-PR dispatch.

De invariant is nu: GitHub Actions run identity en pull-request identity zijn verschillende domeinen en mogen nooit impliciet worden verwisseld.
