# Powerhouse Control Plane: bestaande systeemintegratie zichtbaar (29 oktober 2026)

**Fingerprint:** `portal|powerhouse-existing-system-integration-status|20261029-v1`

## Doel
Het bestaande beveiligde Powerhouse-beheerportaal toont nu in de **bestaande** Control Plane-cockpit de gekoppelde architectuur- en bedrijfsbronnen, met strikt onderscheid tussen `BRON BEREIKBAAR` en `END_TO_END_UNPROVEN`. Dit is geen tweede portaal, scheduler, service of database.

## Technische integratie
- `platform/portal/powerhouse-existing-integration-read-model.mjs`: server-side, alleen GET naar bestaande Supabase REST-views `powerhouse_one_brain_runtime_health_v1`, `powerhouse_one_brain_capability_inventory_v1`, `powerhouse_one_brain_intelligence_inventory_v1`, `powerhouse_autonomous_experiment_readiness_v1` en `powerhouse_revenue_event_spine_health_v1`. Bounded (1/100 rijen), maximaal 4,5 seconden per bron, fail-closed bij fout, onleesbaar of overloop. SELECT alleen niet-identificeerbare velden; geen rijen met klantgegevens uit de portal.
- `netlify/functions/powerhouse-control-plane.mjs`: hergebruikt de **bestaande** Netlify-authenticatie en admin-check, daarna pas server-side SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY uit Functions scope. Geen service-key in response en geen API-openstelling voor bezoekers/tenants.
- `portal-v2/control-plane-cockpit.js`: voegt onder de bestaande obligations een veilig ge-escapete statusmatrix toe voor ONE BRAIN/Powerhouse, Heartbeat, capabilityregister, 32 operationele lagen, Growth/Revenue en CRO-experimenten. Laat ontbrekende bronnen als ONBEKEND zien.
- `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs`: regressie op geen valse groen-claims, bronuitval, oversize, nul-versus-onbekend, autorisatievolgorde, XSS en geen cron/externe write.

## Statusgrenzen en known gaps
Op 29 oktober toont `powerhouse_one_brain_runtime_health_v1` 32/32 WIRED en 18/18 kernjobs actief maar AMBER, vijf runtime-error keys, content BLOCKED, twee evidence-due condities (19 acties zonder action economics en 1.753 overdue calibration). Deze waarde is **historisch gesnapshot**; de nieuwe view leest straks actuele waarden.
Die twee conditions zijn geen ontbrekende fysieke lagen. 54 capabilities in de inventaris zijn geen 54 onafhankelijke werkende uitvoerders. En `growth_event`, `attribution_touch`, `checkout completed`, `revenue_eur` in een bronview of een provider-ACK zijn geen onafhankelijke betaalde omzetcertificaten. De cockpit mag daarom nooit een andere status tonen dan `END_TO_END_UNPROVEN` zolang stagevoor-stage uitvoeringsbewijs niet door de originele Heartbeat/Brain executor is gekoppeld.

## Relatie met parallelle bestaande eigenaren
- [PR #5148](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5148) bezit de pure end-to-end bewijsvalidator in het **backend**-domein en update de bestaande SkillOps-instructie/System Map. Deze portalwijziging schrijft daar niet in.
- [PR #5144](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5144) bezit de CRO `Andere data` route en meet-ACK. Dit is niet gewijzigd.
- De bestaande originele GitHub protected release, Supabase owner writer/Heartbeat #171, Notion masterregister en portaalrechten blijven onaangetast.

## Acceptatie
1. Required/BRAIN/CodeQL incl. nieuwe Node-tests op exact PR-head; geen check overslaan.
2. Protected merge op actuele main; Netlify normale (niet geforceerde) deployment die de betreffende JS en function bundelt.
3. Geauthenticeerde **admin** browser GET en bronreadback, negatieve test ongeauthenticeerd/niet-admin; vijf Supabase views consistent; afschermen van sleutel/tenantdata.
4. Pas dan: `PORTAL_READ_MODEL_LIVE_PROVEN`. De enterprise-brede `END_TO_END_PROVEN` status is apart en vraagt echte Brain/Heartbeat worker-emitter, exact tenant/run/skill/correlation, onafhankelijke provider-/uitkomstbevestiging, betaling en learning + preventie.

Geen root/global status GROEN op basis van deze documentatie, PR of succesvolle query.
