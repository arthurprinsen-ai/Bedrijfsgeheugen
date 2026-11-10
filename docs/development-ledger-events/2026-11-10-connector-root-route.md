# Development ledger — 2026-11-10 — connector-root-404

- **Signaal:** live Netlify 404 top URLs (24h) bevat `/api/connectors` achtmaal, terwijl de eigen client dezelfde root gebruikt.
- **Oorzaak:** oorspronkelijke Netlify route alleen `/api/connectors/*`, niet expliciet `/api/connectors`.
- **Herstel:** uitsluitend Netlify-function config omzetten naar twee paden onder dezelfde getUser()/tenant handler, volledige security/isolation tests aanpassen; openbare readiness blijft eigen functie en is uitgesloten van wildcard.
- **Borging:** source-of-truth portal-registry toont 78 pagina's, een code-listingtest is geen productie-tenantbewijs. Na protected merge exacte Netlify SHA plus HTTP 401 root readback en A/B tests; anders open.
- **Geen fictieve green:** geen connectorproviderdata, geen import, geen voorbeeldwijziging, geen nieuwe executor.
- **Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
