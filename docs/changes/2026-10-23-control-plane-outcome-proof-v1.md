# Powerhouse control-plane: geen groen zonder uitkomstbewijs

Canoniek incident: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Fingerprint `portal|control-plane|fulfilled-without-outcome-proof|20261023-v1`.

## Risico en bewezen bronoorzaak
De interne cockpit gebruikte uitsluitend `current_state=FULFILLED` voor een groen label. Een afgeronde workflow kan daarmee ogen als een bewezen waarde-uitkomst, zelfs als `outcome_verified` ontbreekt. Dit is direct uit de bron geverifieerd, geen claim dat een klant werkelijk verkeerd geïnformeerd is.

## Implementatie
De bestaande getenantiseerde, read-only `/api/powerhouse-control-plane` blijft de canonieke bron. FULFILLED met `outcome_verified !== true` krijgt een rode toestand, het label `FULFILLED · UITKOMST ONBEWEZEN` en een waarschuwing. De teller wordt `Geclaimd afgerond`. Alleen letterlijke boolean true geeft de groene FULFILLED-toestand; het dashboard mag geen uitkomstbewijs verzinnen.

Geen API- of databasewijzigingen, geen extra agent, geheugen, runner, cron, betaalde preview of wijziging in security/tenantgrenzen. De regressie bevat ontbrekend bewijs, echte boolean true, valse string en XSS-escaping en wordt met bestaande dagelijkse leerworkflow getest.

## Acceptatie
Exact-head Required/CodeQL en beschermde merge, daarna echte portaldeploy en productie-/provider-readback vóór LIVE_PROVEN. System Map, Brain learning, green-assurance skill en append-only ledger reizen mee.
