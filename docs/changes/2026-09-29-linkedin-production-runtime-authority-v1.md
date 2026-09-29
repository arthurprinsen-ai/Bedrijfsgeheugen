# LinkedIn production runtime authority over chat-local connector state

## Incident
Op 29 september 2026 gaf de chat-lokale LinkedIn/Composio-sessie een ingetrokken token en daarna een verbinding zonder organisatie-readscope terug. Dat werd ten onrechte geïnterpreteerd als een productieblokkade.

De canonieke Powerhouse-runtime was ondertussen gezond: de setup-state stond ACTIVE, company_ready=true, de organisatie-URN was urn:li:organization:18234216 en de productiekoppeling bezat r_organization_admin + w_organization_social. De bedrijfspost was bovendien al aangemaakt als urn:li:share:7510609161110482944.

## Permanente regel
Chats en agents mogen een chat-lokale connectorstatus nooit meer gebruiken als productie-authority. Voor OAuth/reconnect wordt eerst de canonieke runtime-state en de actuele publication obligation gelezen. Een bestaande provider-URN is terminal publicatiebewijs en verbiedt republish.

Menselijke OAuth is alleen toegestaan wanneer de productie-runtime zelf geen capability-proven account heeft én er nog geen provider-side-effect bestaat.

## Resultaat
Hiermee worden drie fouten tegelijk voorkomen:
- false-positive OAuth blockers;
- alias/connection proliferatie;
- dubbele LinkedIn-publicaties na readback- of sessieproblemen.
