# P0 #4198 — commerciële bron live ≠ bewezen betalende klant, originele Powerhouse-portaalkaart
Datum: 2 november 2026. Status: SOURCE_CANDIDATE (NIET automatisch live).

## Feiten en oorzaak
Oorspronkelijke Supabase-productie `adhjwmvyoixzjtmiroln` heeft migraties 20261031135451, 20261102074013 en 20261102075243 geregistreerd. De native originele scan-trigger reageert nu op latere geverifieerde tenantidentiteit; de offerte-trigger registreert alleen voorstel met EUR 0 en geen betaalbewijs; `anon` en `authenticated` hebben geen directe EXECUTE op de twee private SECURITY DEFINER-triggerfuncties. Oorspronkelijke PR #5252 bronmerge SHA 3621657751881f50240f9dd4a787a76530c7d369; bronherstel #5256 merge SHA 63ab2db777fbb48bfbcf1a503c1b573ba7c32c8c. Bestaande 58 scans: 56 unverified, 2 demo, 0 verified. Bestaande 9 offertes: 4 getekende DEMO (€51.200 nominale waarde), geen verified. Geen bewezen betaalde euro's.

Het oude adminportaal toonde aantallen fouten, maar ondernemers- en operatorperspectief kon die geverifieerde broncorrectie niet rechtstreeks onderscheiden van een daadwerkelijke klantomzet. Bovendien bestaat er nog GEEN bewijs van de eerstvolgende echte tenantverificatie en 0 onafhankelijk betaalde orders. `VALIDATED` incident betekent dus niet dat commerciële KPI groen mag zijn.

## Bounded oplossing in bestaande portal
ÉÉN pure read-only `brain/observability/commercial-intake-proof-readback.mjs` leest via de bestaande `/api/powerhouse-observability` admin/JWT/tenant-gate, achter de service-role boundary, exact twee bekende oorspronkelijke incidenten. Alleen een begrensde samenvatting `SOURCE_LIVE_CUSTOMER_OUTCOME_PENDING` wordt doorgegeven aan de bestaande `systemMapView` van het Powerhouse-portaal. Geen PII, ruwe incidenttekst, vrije fingerprint-query, sleutel, extra Cron, side effect of parallelle writer.

De kaart onderscheidt bronherstel live, offerte niet-betaald, eerstvolgende geautoriseerde tenantclaim en echte betaalorder. Zonder complete providerbacking wordt `UNVERIFIED`, nooit 0 of groen. Betaalde order wordt in deze bron altijd `Niet bewezen`; dit incidentregister is geen betaalprovider, ook niet bij een ogenschijnlijk groen incident.

## Regressie en release
`tests/brain-commercial-intake-original-portal-proof-20261102.test.mjs` test 2 originele incidenten, exacte status, originele migraties, onveilige ACL, ontbrekende bronref, ontbrekende native migratie, dubbele rijen, provider HTTP 403, privacy, admin-gate, en geen valse betaalclaim.
De oorspronkelijke `.agents/skills/trigger-based-mkb-acquisition/SKILL.md`, `brain/learning/2026-11-02-portal-commercial-source-vs-customer-outcome-v1.json`, dit handboek en append-only log worden samen bijgewerkt. Source pas live na Required, CodeQL, oorspronkelijke System Map, protected merge, Netlify exact SHA en geauthenticeerde admin-readback. Echte tenantclaim, eerste providerbetaling, volledige BRAIN backend 28 open fouten en causale klantwaarde blijven afzonderlijk open. Parent #4198/#4439 niet sluiten op alleen deze UI.
