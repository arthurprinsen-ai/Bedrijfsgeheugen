# Correctie activeringsaanvraag in samengestelde portaalstate

Datum: 15 oktober 2026; status van dit document bij schrijven: PR-kandidaat.

## Fout
Klantgebonden `portal.aiModelPreferences` en `portal.aiModelActivationRequest` worden opgeslagen bij de tenant in de legacy-projectielaag. De canonieke Brain-projectielaag kan tegelijkertijd een eigen `portal`-object bevatten. De bestaande `composePortalProjectionLayers` verving dan het hele legacy-portaalobject met dat van de Brain, waardoor eerder opgeslagen activeringsaanvragen niet meer terug te lezen waren. Daarmee kon `GET /api/tenant-ai-activation-status` een aanvraag onterecht als afwezig tonen.

## Correctie
De compositie combineert nu velden op het eerste niveau van `portal`, met *canonieke voorrang bij dezelfde veldnaam*. Legacy-only modelkeuzes en aanvragen blijven zichtbaar, zonder dat oude legacywaarden een expliciete canonieke keuze terugzetten. Het verandert geen runtime-autorisatie, contracten, DPA's of provideraccounts.

De tests `tests/portal-projection-layers.test.mjs` en `tests/brain-tenant-ai-inference-gateway-v1.test.mjs` bewaken de normale compositie én de activatie-readback. Een aanvraag blijft `REQUESTED` en wordt nooit automatisch `ACTIVE`.

## Acceptatie
Required CI, CodeQL, beschermde merge, Netlify exact deploy-SHA en geauthenticeerde productiereadback. Echte provider- en tenantrechten blijven onafhankelijk vereist.
