# Activity ledger — AI modelkeuze aan geauthenticeerde uitvoeringsroute

Datum: 2026-10-15
Obligation-ID: portal-tenant-model-runtime-binding-20261015

## Verifieerbare verandering
De bestaande beveiligde AI-tenantgateway kan klantvoorkeuren negeren. Voor de nieuwe wijziging wordt de portalstate binnen de serverzijde onder de geauthenticeerde tenant gelezen, waarna uitsluitend de ingestelde Brain-modelkeuze wordt getoetst aan het model, de regionale providerroute, de actuele leveranciersstatus en de ondertekende private runtime-receipt. De bestaande providerproef, CSRD/AI-governance-clearing, endpointroute en data-sovereignty-claims blijven vereist. Er is geen aanpassing aan contracten of automatische accountprovisioning gedaan.

## Uitgevoerde stappen
- Policy module `platform/policy/tenant-model-choice.mjs` toegevoegd.
- `platform/api/tenant-ai-inference-handler.mjs` controleert de autorisatie vóór het bestaande `runAttestedTenantChat`.
- `netlify/functions/tenant-ai-inference.mjs` gebruikt EU-first portalstorage, exact catalogusbestand en supplierstatus.
- Historische Brain-runtime tests uitgebreid met geen-egress scenario's voor onjuiste model-ID, tenant, status, regio en opslagstoringen.

## Waar nog bewijs voor nodig is
Required CI, CodeQL, protected merge, versiegelijke Netlify deploy en geauthenticeerde runtime readback zijn nog niet bevestigd. Zonder echte providerattestaties en contracten blijft het model onbruikbaar; we claimen niet dat 110 modellen automatisch uitvoerbaar zijn.
