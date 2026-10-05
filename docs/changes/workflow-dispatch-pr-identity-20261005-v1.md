# Recovery dispatch gebruikt nooit meer een workflow run-id als PR-nummer

Datum: 5 oktober 2026
Obligation: `workflow-dispatch-pr-identity-20261005-v1`

De Required-test recoveryroute gebruikte bij `workflow_dispatch` de GitHub Actions `run_id` als pull-requestnummer. Daardoor kon preflight een niet-bestaande PR opvragen en rood gaan voordat inhoudelijke gates werden uitgevoerd.

De event-normalisatie gebruikt nu uitsluitend een expliciet PR-nummer als PR-identiteit. Als dat aanwezig is worden de bijbehorende immutable base/head refs doorgegeven; als het ontbreekt wordt geen PR-identiteit verzonnen.

Een regressietest borgt dat een workflow run-id nooit meer als pull-requestnummer kan worden gebruikt.
