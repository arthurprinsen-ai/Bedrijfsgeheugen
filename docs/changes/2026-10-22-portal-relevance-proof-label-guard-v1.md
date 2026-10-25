# Portal Relevantie — voorkom onbewezen successen (2026-10-22)

Parent: [#4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547), corrective successor to merged [#4673](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4673); same existing Portal V2 and Brain owner lineage.

## Reproductie
De live source in `portal-v2/native-pages.js` telde `healthy===true && status==='ok'` als `Bewezen in Brain`, zonder maturity `PROVEN`, readback-ACK of bewijsreferentie. De bijbehorende regressietest accepteerde expliciet een volledig bewijsloos groen fixture. In `portal-v2/runtime-evidence.js` werd de oorspronkelijke `PROVEN` status bovendien afgevlakt naar transportstatus `ok` en verloor de bewijsvelden. Dit is een aantoonbare false-positive bronregel; echte gebruikersimpact is niet geverifieerd.

## Veilig herstel
De bestaande servergeautoriseerde tenant-Brain-projectie blijft de enige input. Normalisatie behoudt maturity, bekende HTTPS-providerbewijsreferentie en expliciet `productionVerified` uit het bronobject. Een item telt pas als bewezen wanneer alle drie present en correct zijn naast healthy/status. Alleen `PROVEN` zonder readback, een transport-OK, een onbetrouwbaar domein, een lege klantprojectie of een `OBSERVED` incident telt niet als bewezen. Geen extra scheduler, dataopslag, permissie of achtergrondagent.

## Bewijs
Regressie `portal-v2/tests/relevance-learning-closed-loop.test.mjs` test positief bewijs en meerdere negatieve scenario's, plus normalisatie. Exact-head Required CI, CodeQL, beschermde main-merge, Netlify exact-commit production-ready en geauthenticeerde tenantreadback blijven nodig voor LIVE_PROVEN. Geen uitrolclaim uit dit document afleiden. Hergebruik het bestaande Brain-foutregister en de bestaande skill.
