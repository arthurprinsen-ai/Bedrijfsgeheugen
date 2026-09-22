# Production source push promotion — 2026-09-22

- Obligation-ID: website-nav-megamenu-sitewide-parity-20260922
- Delivery-Lane: website
- Candidate-Type: promotion
- Root cause: de canonieke snapshot-workflow startte op protected main push, maar deploy en proof waren per ongeluk alleen voor workflow_dispatch geactiveerd.
- Herstel: laat exact-source Netlify deploy plus bounded production identity proof ook uitvoeren op de bestaande protected push-trigger van het workflowbestand.
- Security: bestaande `NETLIFY_MCP_PROXY_PATH_TEMP` secrettransport blijft de enige providerroute; geen token of providercredential wordt in code opgenomen.
- Regression: `tests/brain-production-source-push-promotion-v1.test.mjs`.
- Definition of done: protected merge -> push-triggered snapshot -> Netlify ready -> `release.json.commit_ref` exact gelijk aan de promotion merge SHA -> publieke menu-readback groen.
