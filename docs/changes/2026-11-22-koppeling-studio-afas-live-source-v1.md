# Koppeling Studio — echte bronkoppeling en optionele portalweergave

Datum: 22 november 2026. Oorspronkelijke keten: Portal V2 → Koppeling Studio → bestaande tenant-connector-definities → provider → Supabase → bestaande portaalpagina. Geen parallelle app, alternatieve executor of nieuwe scheduler.

## Huidige staat vóór deze wijziging

- Direct uit de database gelezen: `connector_definitions=0`, `connector_executions=0`.
- De originele UI kon een configuratie opslaan en een *sample safe-test* uitvoeren. Een sample heeft geen providerbevestiging en kan geen actuele financiële data bewijzen.
- De originele server gaf configuratiemetadata aan portaalpagina's, maar geen rijen uit een werkelijke leverancier.
- Een breed voorbeeldaanbod (AFAS, Exact, Outlook, SharePoint, Shopify, Salesforce, enz.) is **niet** hetzelfde als werkende providerconnectoren.

## Eerste werkende native read-only providerroute: AFAS

1. Klant kiest in de bestaande Koppeling Studio **AFAS echt verbinden**, en voert omgevingnummer, GetConnector-ID en een in AFAS Profit geautoriseerde XML-token in.
2. Server bouwt slechts de vaste `https://<numerieke-omgeving>.rest.afas.online/ProfitRestServices/connectors/<valid-id>?skip=0&take=100`. Geen willekeurige URLs of redirects, geen schrijfoperatie bij AFAS.
3. Server verifieert de *echte* bronresponse en verstrekt alleen kolomnamen en telling. Het token wordt na geslaagde verificatie via een service-role-only RPC **versleuteld opgeslagen in Supabase Vault**. Geen tokens in portal state, browser drafts, logs, responsebody of GitHub.
4. Klant kiest expliciet welke kolommen en welke bestaande portaalpagina de gegevens mogen gebruiken (optionele persoonsgegevens vragen een extra bevestiging). Hooggevoelige velden worden geweigerd.
5. Dezelfde provider krijgt een tweede live controle met veldselectie en bewijs per connectorversie; **alleen dan** kan de bestaande beveiligde activatie plaatsvinden binnen het plan- en soevereiniteitsbeleid.
6. **Echte data** wordt na activering door `POST /api/connectors/:id/sync` uit AFAS opgehaald. Alleen geselecteerde kolommen, maximaal 100 rijen × 40 velden en begrensde bytes. Er is een insert/upsert in de oorspronkelijke connector-database met **onafhankelijke readback** van exacte rijen, hash en versie, plus een execution receipt.
7. Portaal leest via `GET /api/connectors/page-records?page=<id>` alleen dezelfde organisatie, `Active`, matchende versie, expliciet toegestane bestemming en provider-verifieerde bronrecords. Zoekbare, gepagineerde brontabel in de bestaande pagina. **Geen automatische KPI-mutatie**, AI-verwerking of bewezen besparing uit de ruwe bron.
8. **Toegang intrekken** verwijdert het lokale token uit Vault en de bewaarde brontabel en pauzeert de configuratie. De gebruiker moet het providertoken daarnaast in AFAS intrekken.

## Waar verschijnt de informatie?

Bestaande beschikbare connectorbestemmingen: Cijfers & KPI's, Waarde & financiering, Mensen, Sales Intelligence, Roadmap, Datahubstatus of Bronnenstatus. De info verschijnt als geverifieerde **brongegevens**, niet als officiële KPI. De gebruikersrechten komen rechtstreeks uit de bestaande organisatiegebonden server-API.

## Niet ten onrechte beloven

- **Exact Online** vereist nog providerappregistratie en een echte OAuth-2.0 consent/refresh-flow. Die is **niet** geïmplementeerd in deze AFAS-route.
- SharePoint, Microsoft 365, Shopify, Salesforce, SQL en andere templatevoorbeelden worden hierdoor **niet** ineens echte live bronnen.
- `schedule.refreshMinutes` is abonnementsbeleid, **niet het bewijs dat er een automatische sync draait**. Deze release levert een functionele handmatige refresh via het bestaande portaal. Een canonieke Heartbeat-vervolgstap mag pas 'automatisch draaiend' heten met een onafhankelijke succesvolle provideruitvoering en readback.
- Productiedata van een ingelogde klant is niet getest zonder verstrekt provider- of tenantconsent. Een geslaagde CI-test toont een veilige implementatie, geen echte AFAS-koppeling van een klant.

## Database en beveiliging

Migration `20261122162000_portal_connector_real_afas_source_readback_v1.sql` voegt twee tenantgebonden componenten toe *binnen* de bestaande Supabase-projectdatabase: Vault-koppeling voor credentials en de laatste geverifieerde bron-snapshot. RLS staat aan; `public`, `anon` en `authenticated` krijgen geen tabelrechten. Alleen de oorspronkelijke server-service role mag de storage-RPC gebruiken. Vault-secretfuncties geven plaintext nooit terug aan de browser.

## Verplicht eindbewijs

- Test `node --test tests/brain-portal-connector-real-afas-v1.test.mjs`.
- Required/CodeQL, Netlify parity, beheerde SQL-migratie + RLS-readback, beschermde main-merge, exacte production deploy en zichtbare UI.
- Daarna afzonderlijk: een **echte AFAS-gebruikerssessie** met bestaand GetConnectorrecht en een readback van de gekozen velden op de juiste pagina. Alleen deze laatste mag de werkelijke klantverbinding als operationeel markeren.
