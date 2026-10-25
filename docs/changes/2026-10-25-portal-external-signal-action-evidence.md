# 25 oktober 2026 — Omgevingsradar: externe signalen naar onderbouwde klantacties

**Canonieke parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215  
**Obligation-ID:** portal:source-universe:tenant-safe-next-best-action:20261025-v1  
**Delivery-lane:** portal  
**Fingerprint:** portal|omgevingsradar|generic-signal-without-specific-next-action|20261025-v1

## Gecontroleerde bronwaarheid
Productie op 25 oktober: 156 actieve broncatalogusregels, maar 3 catalogusbronnen met een waarneming in 24 uur; 197 canonieke signalen, waarvan 6 recent. De bestaande bronprojectie is om 07:54 UTC ververst en de laatste canonieke signaalwaarneming is van 06:11 UTC. 23.295 connecties bestaan; 17.400 waren vandaag verrijkt. Deze cijfers bewijzen niet dat iedere bron online is geraadpleegd, dat ieder signaal bij een klant hoort, dat er een opdracht binnenkwam of dat alle 23.295 personen vandaag extern zijn bezocht.

## Oorzaak en gerichte wijziging
De Omgevingsradar koppelde bestaande canonieke signalen, tenantimpact en actievoorstellen niet per exacte signal_key in de getoonde signaalkaart. Hij liet onvoldoende zien welk proces de klant moet toetsen, of een voorstel generiek of specifiek is, of een bron recent waargenomen is en of een actie werkelijk toegewezen is.

- De portal read authority blijft supabase/functions/portal-state-eu/index.ts; geen nieuwe database, crawler, scheduler, CRM, queue of service-role-blootstelling.
- Bestaande tenant_specific en projection_scope zijn strenge gates voor een toegewezen vervolgstap.
- Alleen SCORED tenantimpact met werkelijke company_impacts maakt bedrijfsspecifieke impact mogelijk. Eurobedragen zijn verwachtingen, geen gerealiseerde omzet. Zonder bewijs blijft het onbekend.
- Bronkaarten tonen uitgever, bronstatus, observatieactualiteit en absolute HTTPS-bronlink. Dekking 24 uur staat apart van snapshotverversing.
- Generieke signalen leveren verificatiestappen op, geen verzonnen aanbeveling, marketingactie of koopintentie. Contactbenadering blijft via bestaande Growth/Relationship-gates.
- De canonieke Brain historical replay in tests/brain-portal-external-signal-advice-v1.test.mjs bewaakt cross-signal isolation, generic-versus-tenant, geldclaims, tijdsverval en onveilige URLs.

## Open afhankelijkheden
powerhouse_runtime_scheduler_mux_v3 en powerhouse-commercial-learning-v1 blijven de enige geplande eigenaren. Dagelijkse internetdekking per bron, tenantuitvoering, provider-ACK, orders, omzet en outcome-learning moeten afzonderlijk door canonieke telemetry bewezen worden. Geen bewering dat 156/156 bronnen vandaag zijn bezocht of dat alle connecties gepersonaliseerd waren.

## Releasepoort
Exact-head Required + CodeQL → protected merge → Netlify productie ready op exacte merge SHA → geauthenticeerde Omgevingsradar/readback → dagelijkse bronobservaties en gemeten klantacties/outcomes. Geen groen of live vóór die poort. Het bestaande issue #4215 blijft open voor de volledige end-to-end tenant/outcome-lus.
