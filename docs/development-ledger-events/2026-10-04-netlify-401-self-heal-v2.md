# Development ledger — Netlify 401 self-heal v2

- Datum: 2026-10-04
- Failure class: NETLIFY_DEPLOY_TRANSPORT_AUTH_401
- Herhaling: productie-runs 37215498776 en 37216870647 faalden op de eerste exact-source transportpoging met 401.
- Bestaande preventie: verse proxy vlak vóór upload.
- Vastgestelde lacune: één verse proxy was niet voldoende; een tweede workflow-run met opnieuw OIDC/proxy slaagde.
- Herstel: OIDC + proxy opnieuw verwerven per bounded uploadpoging binnen dezelfde workflow.
- Retry policy: maximaal 3; alleen expliciete 401 is retryable.
- Non-auth fouten: fail-closed.
- Exact-SHA en browser readback blijven terminale waarheid.
- Regression: tests/brain-netlify-proxy-auth-self-heal-v2.test.mjs.
