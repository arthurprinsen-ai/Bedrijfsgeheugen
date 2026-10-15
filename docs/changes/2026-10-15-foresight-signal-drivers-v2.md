# Foresight scenario-drijvers: geauthenticeerde Powerhouse-signalen (v2)

Obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4420
Fingerprint: powerhouse|portal-v2|tenant-scored-signal-drivers|v2

## Bestaande bron
De bestaande route `/api/portal-ondernemersdata` authenticates de identiteit via Netlify Identity en resolveIdentityTenant. De EU store haalt `entrepreneur_intelligence` op voor de ingelogde tenant. De payload scheidt canonical external baseline van expliciet tenantgescoorde companyImpacts.

## Scope van deze kandidaat
- De bestaande scenariostudio bevat aanvullend een opt-in signalenpaneel, geen nieuw dashboard of opslag.
- De ondernemer kan recente, tenantgescoorde signalen bekijken en filteren op risico, kans of andere ontwikkeling. Er wordt rekening gehouden met het gekozen bedrijfsdoel via indicatieve domeinhints.
- De interface gebruikt de bestaande beveiligde API en hergebruikt de bestaande Omgevingsradar voor bronverificatie.
- Signalenscores zijn geen voorspelde kansen; kansen, omzet en besparingen worden niet gekwantificeerd zonder onafhankelijke prognosevalidatie.
- De bestaande scenario-baseline blijft onaangetast bij laden van de signalen.
- Scenario-effecten volgen doelrichting: bij restrisico en handmatig werk betekent een positieve verbetering juist een lagere verwachte waarde. Dit is alleen een scenario-aanname, geen causale modelvoorspelling.

## Veiligheidscriteria
- Vereis scope.authenticatedTenant gelijk aan intelligence.tenantId; wees fail-closed bij mismatch, absent claim of canonical tenant.
- Vereis tenantExposureApplied=true, tenant_specific_impact=true, impact_status=SCORED en ten minste één status=SCORED in company_impacts.
- Laat signalen ouder dan 45 dagen, sterk toekomstgedateerde signalen en ongeldige impactscores weg.
- Geen opslag van klantsignalen in global state, localStorage of uitwisseling met andere tenants.
- Geen numerieke forecast op basis van een impactscoreshift en geen claims van onafhankelijk bewezen causaliteit.

## Nog vereist
Protected Required CI, CodeQL, Netlify exact-SHA deploy en een geauthenticeerde productie-readback op de tenantgebonden bron. De live signalenkwaliteit blijft afhankelijk van bronversheid en correct gescoorde klantimpacts.

Test: `node --test tests/brain-foresight-signal-drivers-canonicalization.test.mjs`
