# Private Portal Trust Surfaces v1

## Besluit
Data & AI Sovereignty, Security Trust Center en de gerelateerde compliance/trust-pagina's zijn geen publieke websitepagina's. Ze bestaan uitsluitend als Portal V2-capabilities voor ingelogde klanten en Bedrijfsgeheugen-beheerders.

## Toegangsmodel
- publieke bezoeker: geen trustpagina in navigatie, zoekresultaten of deep-linkweergave;
- demo/preview: geen toegang tot trustpagina's;
- ingelogde klant: alleen eigen server-side resolved tenant;
- Bedrijfsgeheugen-admin: canonical interne scope via bestaande admin-boundary;
- de API blijft de autorisatieauthority; client-side route of slug verleent nooit rechten.

## UX
Na login staan de pagina's native in Portal V2:
- Data & AI Sovereignty;
- Security Trust Center;
- Compliance, security & governance;
- Compliance Command Center;
- EU AI Act auditrapport.

De eerste twee gebruiken de bestaande authenticated APIs voor data-soevereiniteit en security-trust en tonen contextuele, interactieve evidence. Geen los tweede portaal.

## Legacy URLs
Oude standalone URLs renderen geen zelfstandige trustcontent meer. Ze verwijzen alleen naar de corresponderende Portal V2 deep-link:
- https://www.bedrijfsgeheugen.nl/portal/data-ai-passport.html → Portal V2 Data & AI Sovereignty;
- https://www.bedrijfsgeheugen.nl/portal-next/security.html → Portal V2 Security Trust Center;
- https://www.bedrijfsgeheugen.nl/portal-next/compliance.html → Portal V2 Compliance Command Center.

## Security invariant
Authenticatie verbergt niet alleen datafetches; protected trustpagina's worden vóór login ook uit navigatie, hubs en portal search verwijderd. Een directe page-call faalt dicht. Demo geldt nooit als klantauthenticatie.
