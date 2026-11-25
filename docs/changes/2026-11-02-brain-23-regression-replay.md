# P0 — BRAIN 23 testfouten: gerichte herstelkandidaat (2 november 2026)

**Original owner:** ONE BRAIN backend. **Parent:** #4439. **Obligation:** `brain-original-backend-23-regression-replay-20261102-v1`.
**Bron:** GitHub Actions #41421421023, SHA `6c636e4fcef4b148d955b3eaa985001a3b496920`: 5.377 tests, 5.352 pass, 23 fail, 2 skipped.

Deze wijziging corrigeert de volgende bron- en contractafwijkingen binnen de bestaande keten:
1. Portal `app.js` gebruikt weer de exacte bestaande gegenereerde System Map-digest `084658d710a10b747bb39cf25f35b8e9521435714c89863286aeebc526ba1cef`; geen nieuwe assetversieautoriteit.
2. Het read-only GitHub-blogwatchdogcontract toetst daadwerkelijk de huidige onafhankelijke publieke readback en faalt bij ontbrekend livebewijs. Het herintroduceert **geen** tweede writer of publicatie-PR.
3. De BRAIN-tests verifiëren de vastgepinde Supabase action-commit (niet een wijzigbare tag), één canonieke CRO-producer inclusief element, en het gedeelde 6+2 Mira-bronbudget met oorspronkelijke supply-gates.
4. De directiepagina exposeert haar bestaande page-id als DOM-context, zonder nieuwe backend of autorisatie.
5. De historische outcome-fixture bevat meeteenheid, metric, baseline, periode en actie-ID; provider-only is en blijft onvoldoende.

**Nog niet bewezen:** volledige 0 failures, protected merge, productie-livegang, uitgaande sociallevering, betaalde klanten of leereffect. De overige oorspronkelijke failures worden niet genegeerd. Voor de echte provider-migratiebronlocks blijft onafhankelijke Supabase-readback noodzakelijk. Er worden geen RLS/OAuth/CodeQL/Required-regels omzeild.

**Acceptatie:** herhaal volledige BRAIN, controleer exact HEAD, corrigeer resterende fouten met onafhankelijke bronbewijzen, integreer uitsluitend via protected merge en verifieer de exacte productie-SHA. Incident en terugvaltest blijven open tot onafhankelijke follow-up.
