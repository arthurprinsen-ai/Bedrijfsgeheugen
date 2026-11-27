# Portal V2 CSV / Excel import — activiteit & bewijsketen (22 november 2026)

- **Fingerprint / obligation:** `portal-v2-csv-excel-import-20261122`; bestaande Portal V2 → BusinessInput → ONE BRAIN → Powerhouse → Heartbeat.
- **Oorspronkelijke uitvoerder:** Portal V2; gebruik bestaande `portal-v2/domain-state.js`, `portal-v2/portal-state.js` en canonieke BusinessInput-ACK.
- **PR:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6108
- **Wijziging:** één eenvoudige upload in huidige bovenbalk met CSV/.xlsx, lokaal lezen, expliciete preview/goedkeuring, beperkte opslag, SHA-256 duplicaatdetectie en terugleescontrole per ingelogde identiteit; géén extra navigatie, externe parser, tweede writer/store of scheduler.
- **Test:** `tests/brain-portal-v2-data-import-v1.test.mjs` (historical, shadow, canary). Bij commit `4af40185aea1308eab274a44b61fb42f6bb004e0` learning-tests 7/7 groen, maar integratiebundel miste nog dit ledger; gecorrigeerd in huidige PR.
- **Security:** tenant/demo-grens fail-closed; geen scripts of formules uitvoeren; geen automatische overschrijving van KPI's of bestaande klantgegevens.
- **Groen-voorwaarden:** Required test/hygiene + CodeQL op exacte head; beschermde merge; Netlify productiedeploy exact gemergde main-SHA; echte geautoriseerde CSV en XLSX-upload, geslaagde server-readback en onafhankelijke ONE BRAIN consumer-ACK.
- **Status op vastlegging:** **KANDIDAAT / NIET BEWEZEN LIVE**. Een branch, een PR, lokale passing test of Netlify READY alléén telt niet als gerealiseerde klantuitkomst.
- **Beperkingen:** CSV en eerste werkblad .xlsx; 4 MB per bestand, 1000 rijen, 40 kolommen, 220 KB per tabel, 450 KB totaal, max 20 opgeslagen bestanden. Grote bronnen via bestaande koppelingen.
- **Leren:** eerdere CI-fouten `PR_MACHINE_METADATA_INVALID`, `LEARNING_EVALUATION_FAILED` door regex, `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger`; voorkom herhaling met het bestaande machinecontract en deze regressie.
