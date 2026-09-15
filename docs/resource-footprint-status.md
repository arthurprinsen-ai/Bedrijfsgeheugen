# Bedrijfsgeheugen Powerhouse — Resource Footprint

**Contract:** `powerhouse-resource-footprint-v1`  
**Scope:** Portal V2 `CSRD & Impact` + canonical Powerhouse cost/resource ledger  
**Implementation branch:** `bg-resource-footprint-v1`

## Canonieke keten

Er wordt geen parallel resource-, analytics- of learning-systeem gemaakt.

1. `brain_budget_usage` blijft de append-only authority voor ruwe kosten- en resource-usage facts.
2. `powerhouse_resource_factors` bevat versieerbare impactfactoren met geldigheidsperiode, bron/provider/model-scope, methodiek en confidence.
3. `powerhouse_resource_impact_v1` projecteert ruwe usage naar energie, CO2e en water. De view draait als `security_invoker` en is niet beschikbaar voor `anon` of `authenticated`.
4. `platform/cost/ai-token-usage.mjs` hergebruikt bestaande provider-tokenmeting en kan dezelfde factorrecords deterministisch toepassen.
5. `portal-v2/csrd-impact.js` toont footprintwaarden alleen als er aantoonbare brondekking is. Zonder dekking blijft de bestaande melding `Voorbeelddata · geen live claim` staan.
6. Materiële state, evidence en learnings horen terug in de bestaande Powerhouse-record/learning-lineage; geen tweede geheugen.

## Berekening

Per usage-event en resourcefactor:

`impact = usage_amount / quantity_basis * factor_value`

Dit wordt afzonderlijk toegepast op:
- energie in kWh;
- CO2e in kg;
- water in liters.

Een factor matcht alleen wanneer resource-type, unit, geldigheidsperiode en — indien ingevuld — provider/source overeenkomen. AI-tokenfactoren kunnen bovendien modelspecifiek zijn.

## Geen schijnprecisie

- Een ontbrekende factor levert `unknown_factor`, nooit nul.
- Een ontbrekende energie-, CO2e- of waterfactor blijft `NULL`.
- Provider-/metergegevens blijven onderscheiden van afgeleide schattingen.
- AI prompts, antwoorden en andere inhoud worden niet in de footprintmeting opgeslagen; alleen usage-metadata.
- Retired Make-usage en synthetische historische testdata worden uitgesloten van de actuele footprintprojectie.
- Iedere afgeleide waarde moet factor-id, methodiek en confidence kunnen teruggeven.

## Multi-tenant/provenance

De actuele projectie leest `tenant_id` uit canonical usage metadata en gebruikt alleen `canonical` als expliciete platformbrede fallback. Nieuwe resource-producers moeten minimaal leveren: stabiele `usage_id`, tenant/company scope, source/provider, resource type, unit, hoeveelheid, occurred_at, measurement/evidence metadata en waar relevant provider usage id.

## Portal V2

`withResourceFootprint()` verrijkt de bestaande CSRD snapshot. Bij geldige dekking worden energie, CO2e, water en brondekking als data-backed weergegeven. De interne view toont tevens confidence en factorversies. De klantweergave houdt interne evidence-details buiten beeld.

## Factor lifecycle

Een factorrecord bevat minimaal:
- `factor_id`;
- `resource_type` en `unit`;
- optioneel `source`, `provider_model_id` en `geography`;
- `quantity_basis`;
- `energy_kwh`, `co2e_kg`, `water_liters` waar aantoonbaar beschikbaar;
- `methodology`, `source_reference`, `confidence`;
- `valid_from` en optioneel `valid_to`.

Factoren mogen niet uit aannames of marketingclaims worden ingevuld. Bij onvoldoende betrouwbare openbare/provider-evidence blijft impact onbekend terwijl de ruwe usage wel wordt gemeten.

## Security

`powerhouse_resource_factors` heeft RLS aan. `powerhouse_resource_impact_v1` is `security_invoker`; `anon` en `authenticated` hebben geen directe rechten. De bestaande server-side Powerhouse-route blijft authority voor ingest en uitlezing.

## Releasebewijs

Definitieve status wordt pas `LIVE & BEWEZEN` wanneer PR #1623 exact groen is, naar `main` is gemerged, de productie-deploy dezelfde wijziging bevat en productie-readback de Portal V2- en Powerhouse-keten bevestigt. Tot dat moment is de release-status `DEELS LIVE`: de Supabase factorregistry en impactprojectie zijn al actief, de GitHub/Portal-wijzigingen nog niet productiegepromoveerd.
