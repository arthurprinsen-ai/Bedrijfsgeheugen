# Development ledger — activeringscentrum klantmodel

**Obligation-ID:** portal-tenant-provider-activation-center-20261015

## Aanleiding en reikwijdte
De klant ziet 110 AI-modellen en kan een tenantbreed standaardmodel kiezen. Een wens levert echter geen providerrechten of AVG/AI Act-goedkeuring op. Er ontbrak een transparante klantflow die echte providerblokkades kan teruglezen.

## Wijzigingen
- `platform/api/tenant-ai-activation-readiness.mjs` voert acht onafhankelijke, read-only bewijscontroles uit.
- `platform/api/tenant-ai-activation-handler.mjs` en `netlify/functions/tenant-ai-activation-status.mjs` geven uitsluitend een geauthenticeerde klant zijn eigen niet-gevoelige statussen terug.
- `portal-v2/modules/ai-model-choice.js` toont de stappen en laat een bevoegd ingelogde klant zonder credentials een activeringsaanvraag indienen in de bestaande tenantstore. De aanvraag wordt teruggelezen; serverreadback is apart nodig om ontvangst te bevestigen.
- Bestaande Brain- en Portal-regressietests controleren bewust geen provider-egress en onafhankelijk tenant-/providerbewijs.

## Grenzen
De frontend verzamelt geen API-sleutels, providercontracten of ongecontroleerde eindpunten. Een aanvraag is **geen** toestemming voor verwerking, geen DPA en geen goedgekeurd provideraccount. PARTIAL/CONFLICT, niet-geverifieerde EU-regio's en ontbrekende ondertekende proof blijven geblokkeerd. De activering vereist nog bevoegde providerprovisioning en echte onafhankelijke readback. CI, beschermde merge en productieacceptatie moeten afzonderlijk slagen.
