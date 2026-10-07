# Source Universe & Environment Radar v1

## Doel

Bedrijfsgeheugen krijgt één structurele intelligence-laag voor alles wat buiten én binnen een bedrijf kan veranderen en een managementbeslissing kan beïnvloeden. De capability maakt van losse bronnen geen nieuwsfeed, maar een traceerbare keten:

`source → evidence → signal → company context → impact → recommendation → canonical action → observed outcome → measurement → learning`.

## Scope

De Source Universe-catalogus omvat onder meer wet- en regelgeving, cyber, AI en technologie, markt- en klantgedrag, concurrentie, subsidies, rente en financiering, macro-economie, arbeidsmarkt, skills, energie, klimaat, grondstoffen, supply chain, geopolitiek, handel, duurzaamheid, demografie, media, communities, zoekgedrag, prijzen, vastgoed, mobiliteit, aanbestedingen, bedrijfsregisters, M&A, patenten, normen, reputatie, verzekering, fraude, gezondheid en lokale omgeving.

Dezelfde catalogus bevat interne bronsoorten zoals ERP, CRM, accounting, HR, projecten, service, productie, voorraad, contracten, e-mail, agenda, documenten, BI/data-platforms, webanalytics, advertenties, betalingen, leveranciers en klantfeedback. Een catalogus-item is een capability, geen bewijs dat een klantkoppeling actief is.

## Truth boundaries

- `CATALOGUED` betekent alleen dat de bron en het gebruiksdoel bekend zijn.
- `CONNECTED`, `OBSERVED` en `LIVE` vereisen echte runtime/provider evidence.
- Externe relevantie, urgentie en bronconfidence mogen deterministisch worden gescoord.
- Bedrijfsexposure blijft onbekend totdat eigen context of bewijs beschikbaar is.
- Euro-impact blijft NULL totdat een bedrag evidence-backed kan worden afgeleid.
- Een aanbeveling is geen actie; uitvoering blijft bij de bestaande Brain/action/obligation authority.
- Een uitgevoerde actie is geen outcome; alleen gemeten/waargenomen resultaat mag Outcome Memory en learning voeden.

## Existing-state-first

Er ontstaat geen tweede externe-signalenstore of scheduler. De uitbreiding hergebruikt:
- `public.bg_signaal_onderwerpen`;
- `public.bg_externe_signalen`;
- `public.powerhouse_evidence_sources`;
- `public.powerhouse_evidence_source_observations`;
- Company Intelligence OS;
- bestaande action/outcome/learning authorities;
- `public.powerhouse_evidence_daily_maintenance_v1()` als periodieke refresh owner.

## Portal V2

De bestaande groep **Actueel & externe data** bevat nu de **Omgevingsradar**. De radar toont:
- Sinds gisteren veranderd;
- Wat raakt mijn bedrijf?;
- Kansen;
- Risico’s;
- Context nodig vóór impactclaim;
- Volgende acties;
- volledig domeinuniversum;
- bronuniversum en live/connected/catalogued onderscheid.

Specialistische pagina’s voor wetgeving, arbeidsmarkt, subsidies, economie, AI/technologie, deadlines en bronnen blijven drill-downs op dezelfde intelligence-context.

## Security

De nieuwe catalogus- en impacttabellen hebben RLS en geen browser grants. Portaldata loopt via authenticated Netlify Identity en de server-side service boundary. De klant ziet geen onbewezen tenantimpact; de huidige basisprojectie is expliciet generiek totdat bedrijfsspecifieke exposure-evidence is aangesloten.

## Runtime

- Source catalog: `public.powerhouse_source_catalog_v1`
- Impact projection: `public.powerhouse_signal_impact_assessment_v1`
- Refresh: `public.powerhouse_refresh_environment_radar_v1(text)`
- Heartbeat: `public.powerhouse_evidence_daily_maintenance_v1()`
- Loop Assurance: `environment-radar`
- API: `netlify/functions/portal-ondernemersdata.mjs`
- Portal: `https://www.bedrijfsgeheugen.nl/portal-v2/?page=omgevingsradar`

## Delivery truth

Merge/deploy is niet hetzelfde als LIVE_PROVEN. Terminale closure vereist protected-main gates, Supabase migration readback, Netlify exact-main readback, authenticated Portal/API readback en actuele Loop Assurance evidence. Ontbrekende outcome/learning stages mogen de loop AMBER houden; ze mogen nooit synthetisch groen worden gemaakt.
