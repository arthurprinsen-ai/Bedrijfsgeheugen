# Veilig leren van klantdoelen: bewijs vóór kalibratie

**Obligation:** `portal|goal-outcome|verified-receipt-calibration|20261023-v1` · bestaande eigenaar [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).  
**Status:** kandidaat, niet live bewezen.

## Bronbevinding
De bestaande `brain/context/goal-outcome-learning.mjs` accepteerde `VERIFIED`, `healthy`, `COMPLETED` of generieke `sourceRefs` als bewijs van gerealiseerd resultaat. Zo konden drie statusregels of hergebruikte bewijsreferenties de modelkalibratie activeren. `Number(null)` en lege strings werden als 0 geïnterpreteerd. Dit is een geconstateerd codepad, **niet** het bewijs dat echte klanten daadwerkelijk onjuist advies kregen.

## Wijziging binnen ONE BRAIN
De bestaande Brain/Powerhouse/Heartbeat-lus blijft eigenaar. Een resultaat draagt pas bij aan kalibratie bij een bevestigde outcome-status of expliciete serververificatie **én** minimaal één niet-lege, canonieke `evidenceId`. Negatieve/pending staten, alleen actievoltooiing, algemene bronverwijzingen, herhaalde outcome-ID's en gedeelde bewijsreferenties tellen niet mee. Ontbrekende, lege of ongeldige effecten blijven onbekend. Bij onvoldoende bewijs blijft de factor `null` en toont de bestaande scenariomotor geen 'evidence-adjusted' effect.

Deze afscherming valideert niet zelfstandig het bestaan of de echtheid van externe receipts: tenantgebonden serverauthenticatie, provider-evidence en onafhankelijke uitlezing blijven de autoriteit. Dit is **geen** grond om geauditeerde winst of causale AI-verbetering te claimen.

## Bewijsroute
- Reproduceer de bronfout op historisch gedrag en toets 3 unieke receipts.
- Test ontbrekende bewijsregels, ongeldige statussen, dubbele ID's, gedeelde receipts, ontbrekende numerieke metingen en de bestaande goal-scenario-integratie.
- `node --test tests/brain-goal-outcome-learning.test.mjs tests/brain-goal-outcome-proof-calibration-v1.test.mjs tests/brain-goal-scenario-engine.test.mjs`.
- Historical replay / shadow / canary worden door dezelfde deterministische testfile geborgd; productiepromotie alleen via exacte SHA Required + CodeQL, beveiligde merge, Netlify/provider-readback en latere onafhankelijke klantuitkomstmeting.

Geen nieuwe agent, scheduler, database, AI-leverancier, geldstroom, queue of productie-write; alle bestaande klantdata blijven in hun huidige JWT-/tenant-scoped pad.
