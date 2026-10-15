# Foresight V3 — contextuele bronfilters zonder tweede datalader

Obligation: powerhouse-foresight-tenant-evidence-filters-v3
Existing production base SHA: d7c267a2043995a0beb6c2c50335566d14b53862

De bestaande Portaal V2 scenariostudio en geauthenticeerde Powerhouse-bronoverlay (#4427) blijven de enige bronroute. Deze uitbreiding voegt een selecteerbaar brontype toe (alle, risico's, kansen, overig) en een knop om de klantgebonden brondata opnieuw op te halen. De metricselectie rangschikt bestaande bedrijfseffecten; de filter verandert noch financiële extrapolatie, noch kans of geldbedrag.

## Exacte beveiligingsregels
- De serverresponse wordt alleen gebruikt indien scope.authenticatedTenant exact gelijk is aan intelligence.tenantId.
- Elk bedrijfseffect is SCORED, voorzien van dezelfde tenant_id, niet ouder dan 90 dagen en gekoppeld aan een canonical signal.
- Alleen toegestane, tenantgebonden actievoorstellen worden getoond. Deze zijn niet uitgevoerd.
- De geselecteerde signalencategorie filtert zowel bron-impacts als voorgestelde acties.
- Er ontstaat geen tweede API-client; bestaande auth voor /api/portal-ondernemersdata en bestaande evidence-loader blijven intact.
- Refresh is expliciet, oudere overlappende antwoorden worden genegeerd en verdwenen schermen niet bijgewerkt.
- Missing/unauthenticated/invalid packets fail closed. Platformbrede Heartbeat is geen gevalideerde klantprognose.

## Acceptatie
- node --test tests/brain-foresight-signal-filters-v3.test.mjs
- Portal/native tests, canonical replay/shadow/canary, Required CI, CodeQL, protected merge en onafhankelijke productiecontrole.
- De bronstatus en eventuele ontbrekende tijdreeksen blijven afzonderlijk zichtbaar. Niet behandelen als volledig gevalideerde causale forecasting.
