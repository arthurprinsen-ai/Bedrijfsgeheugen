# Development ledger — original code release readback naar Brain

- Datum 2026-11-15, P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Eerste echte agent PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908
- Origineel werk `2c1ecc77-58aa-4f25-ae68-e2337853fdc7`, op `56e16919-6275-4c2e-9208-6ac0c8a29a29`
- Bronrelease `60c41d4813f3bc0d3a3ef9fcdca095597221a0da` en Netlify deploy `6afa1140fce862102329274e`
- Bronbewijs https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43756362047
- Fout: PR-build/readback en productie-release waren twee losse bewijsregistraties zonder automatische oorspronkelijke Bron-CAS-overdracht.
- Gevolg: operator moest na livegang 1e original-case met originele RPC versie 7→8 registreren; originele observability-innovatie niet voltooid (business-effect en consumer-ACK ontbreken).
- Correctie: binnen SAME bestaande `Production Release Readback` conditioneel exact Github/Netlify/Oorspronkelijke Brain en idempotente original `brain_transition_operation` versie-CAS plus onafhankelijke GET. Geen andere release telt.
- Regressie: `tests/brain-innovation-original-code-production-receipt-20261115.test.mjs`
- Leerrecord: `brain/learning/2026-11-15-innovation-original-release-into-brain-v1.json`
- Preventie: geen claim productie-uitvoering zonder exacte SHA/providerreadback, nooit vervalste terminal success/ROI; oorspronkelijke status PLANNED/OPEN.
- Release: nieuwe source kandidaat heeft nog Required, CodeQL, exact protected main en oorspronkelijke productie run nodig; geen claim gedaan vóór die controles.
