# 2 november 2026 — BRAIN-redactietest controleert verouderde variabeledeclaratie

## Onafhankelijke bronafwijking
Oorspronkelijke volledige BRAIN-run [41411665780](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41411665780) voerde 5.362 tests uit: 5.328 geslaagd, 32 mislukt. Een van de mislukte assertions zit in `tests/brain-brand-learning-editorial-tdz-v1.test.mjs`. De test zocht op exacte `const editorialSystem`, maar de actuele canonieke `supabase/functions/powerhouse-content-orchestrator/index.ts` declareert `let editorialSystem` omdat de buyer-first kwaliteitsregels later met `editorialSystem +=` worden toegevoegd.

## Veilig contract en bronbehoud
Het oorspronkelijke `verifiedBrandLearningGuide` wordt voor de enkele `editorialSystem` declaratie opgebouwd. De buyer-first-regels volgen vóór `stage = 'artifact-ai'` en vóór de call naar het oorspronkelijke AI-model. De veiligheidsvoorwaarden voor geverifieerde leerdata, geen verzonnen ik-ervaring, geen neppercentages, doelgroepwaarde en gescheiden review/publicatie blijven onaangetast. Een `const` terugzetten zou juist de latere append onveilig maken. De nieuwe regressie vereist precies één `let` prompt, bronleervolgorde en extra buyer-first append vóór generatie.

## Verplichte vervolgrelease
Test gericht de bestaande originele BRAIN-test en daarna alle backendtestbestanden op exact beschermd kandidaat-HEAD. Vereist Required, CodeQL, beschermde merge, exacte postmerge BRAIN en afsluiting; actualiseer de telling alleen vanuit de nieuwe originele run. Original incident `powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1` blijft OPEN, net als alle andere foutbronnen. Geen providerpost, klantorder of omzet wordt geclaimd. Deze kandidaat wijzigt alleen test, bestaande agent/school skill, ONE BRAIN learning en menselijke documentatie, niet de bestaande runtime of publicatiemachtigingen.

Fingerprint: `powerhouse|brain|editorial-tdz-const-let-test-drift|20261102-v1`.
