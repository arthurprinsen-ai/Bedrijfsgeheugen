# Development ledger — external observer provider-truth fallback

- **Date:** 2026-10-07
- **Kind:** IMPROVEMENT / DELIVERY_GOVERNANCE
- **Fingerprint:** `delivery|external-observer|provider-truth-fallback|v1`
- **Observed defect:** een publieke web-fetcher kon de productie-origin niet direct fetchen en vormde daardoor een schijnblocker voor de onafhankelijke eindcontrole.
- **Root cause:** observer-capability werd niet expliciet gescheiden van productieautoriteit.
- **Change:** provider-truth evaluator + contract + agentregel + System Map capability + regressietest.
- **Safety:** canonical Production Release Readback blijft fail-closed; exact SHA, alias, production-context, GitHub-lineage en function inventory blijven verplicht.
- **Evidence:** Netlify deploy `6ac63f6b64dc6f000885899d`, commit `e53c39adfb7dcd945515f2421ac2f233eb6cda5b`, production alias `https://www.bedrijfsgeheugen.nl`.
- **Prevention:** `OBSERVER_FAILURE_NEVER_OVERRIDES_EXACT_PROVIDER_AND_LINEAGE_TRUTH`.
