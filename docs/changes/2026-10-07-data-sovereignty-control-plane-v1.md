# Data Sovereignty & AI Compliance Control Plane

## Waarom deze laag bestaat

Bedrijfsgeheugen moet niet alleen zeggen dat data veilig of Europees wordt verwerkt. Het systeem moet per gegevensstroom aantoonbaar laten zien **waar data binnenkomt, waar deze wordt verwerkt, waar deze wordt opgeslagen, welke provider of subprocessor erbij betrokken is, of grensoverschrijdende doorgifte mogelijk is en welk bewijs daarbij hoort**.

Daarom is data-soevereiniteit geen losse informatiepagina maar onderdeel van dezelfde Brain → Heartbeat → Powerhouse-loop.

## Wat nu structureel is ingericht

De control plane bevat een providerregister, dataflowregister, AI-use-case register, connector-residency en een tenantgebonden sovereignty-policy. Het Compliance Command Center toont zowel Bedrijfsgeheugen zelf als de eigen klantorganisatie.

De ondersteunde beleidsmodi zijn:

- **TRANSPARENT_GLOBAL** — wereldwijde routes mogen bestaan, maar locatie, doorgifte en onbekenden blijven zichtbaar.
- **EU_STORAGE** — opslag moet aantoonbaar binnen de EU blijven; onbekende opslag wordt geblokkeerd.
- **EU_ONLY** — opslag én verwerking moeten aantoonbaar binnen EU/EEA blijven. Vertrouwelijke AI en connector-routes worden fail-closed geblokkeerd als bewijs ontbreekt.
- **CUSTOM** — basis voor fijnmazige klantpolicy.

Een klant kan een gewenste AI-provider of regio kiezen. Dat is alleen **desired state**. Het systeem schakelt niet stilletjes om voordat de gekozen route daadwerkelijk is geconfigureerd en met runtime/evidence is bewezen.

## Actuele providertruth

Supabase is voor het productieproject aantoonbaar in **eu-central-1**. Klantgebonden Edge-aanroepen worden expliciet met de regioheader `eu-central-1` uitgevoerd.

Netlify wordt bewust niet als EU-only weergegeven. De Netlify preview van PR #4052 rapporteerde voor deze site Functions in `iad` / `us-east-1` en Blobs in `us-east-1`. Alleen twee bestaande social-publication functies hadden een afzonderlijke EU-region override. Daarom blijft de klantportalroute voor Netlify op `PLATFORM_ROUTED_UNPINNED`, `PLATFORM_MANAGED_UNKNOWN_REGION` en `PARTIAL` evidence staan.

Een runtime-regio is bovendien een observatie, geen juridisch of technisch residency-certificaat.

## Fail-closed uitvoering

Voor vertrouwelijke portal-AI, portalvertaling en connector-AI wordt de tenantpolicy gecontroleerd vóór de modelcall. Onder `EU_ONLY + BLOCK` wordt een niet-bewezen route geweigerd.

Connector-test en connectoractivatie worden eveneens vooraf gecontroleerd. Zonder VERIFIED residency-evidence voor de relevante bron/doelroute kan een connector onder een strikte policy niet stilletjes actief worden.

## Automatische herijking

De Powerhouse heartbeat vernieuwt de sovereignty snapshots. Nieuwe of gewijzigde providers, AI-routes, connectors en observations worden daardoor opnieuw tegen het actuele tenantbeleid beoordeeld. De vaste truth-policy is:

**measured_or_evidence_backed_else_unknown**

Onbekend wordt dus niet automatisch groen.
