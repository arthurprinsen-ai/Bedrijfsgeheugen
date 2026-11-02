# Veiligheidskompas — betrouwbare veiligheid voor ondernemers
Datum: 2 november 2026. Status: **kandidaat; niet als live bewezen verklaren voordat de beschermde merge, volledige BRAIN en Netlify-broncontrole zijn afgerond**.

## Klantvraag en eerste beginselen
Een ondernemer hoeft `EVIDENCE_PARTIAL`, `RLS` of `CodeQL` niet te begrijpen om veilig te kunnen handelen. De private portalpagina **Security Trust Center** krijgt een eerste, begrijpelijke laag: **Jouw Veiligheidskompas**. De oorspronkelijke bron, serverauthenticatie, tenantisolatie, beheerscherm, Heartbeat en exclusieve releaseketen blijven ongewijzigd.

Het kompas laat een niet-commerciële statuszin zien, een laatste bronmoment (Europe/Amsterdam), bewijsdekking **expliciet niet als veiligheidsscore**, aantal open punten en vijf controlegebieden: toegang, gegevensbescherming, code/updates, website/verbinding en leveranciers/omgevingen. Elk gebied is pas positief bij volledig, actueel en expliciet bewezen bronnen. Onbekend is geen groen. Negatieve broncontroles zijn aandachtspunten; dat impliceert niet automatisch een datalek.

De ondernemer krijgt twee zelfstandige vervolgstappen (toegang beheren en datapaspoort), uitleg wat Bedrijfsgeheugen controleert en een toetsbare uitleg van de methode. Status wordt beschreven met tekst naast kleur, zonder onnodige beweging; telefoon- en toetsenbordbediening zijn onderdeel van de tests.

## Minimum disclosure
De technische open risico's, ruwe observatie-ID's, provider-geheimen, SQL-controleclassificaties en operationele detailregels worden niet aan gewone klanten geprojecteerd. Technische details blijven in de geauthenticeerde bestaande beheerweergave en het originele private incidentregister. Geen nieuwe publieke statuspagina en geen effect op andere tenants.

## Niet opgelost door de UX
De Netlify-archieftestomgeving heeft nog geen onafhankelijk bewezen bezoekersbeveiliging, en Supabase heeft een open waarschuwing over een publiek uitvoerbare geprivilegieerde RPC. **Deze risico's moeten open blijven totdat bronbescherming, originele cron-werking en de beveiligingsadviseur onafhankelijk aantonen dat herstel is geslaagd.** De nieuwe UX mag dit nooit met geruststellende taal maskeren.

## Verificatie
Dedicated replay: `tests/brain-security-entrepreneur-compass-v1.test.mjs`. Bestaande regressies: `tests/portal-private-trust-surfaces-v1.test.mjs` en `tests/brain-security-trust-center-v1.test.mjs`. Vereist: alle bestaande Required, CodeQL, BRAIN, browser/UI en beschermde releasechecks. Uitrol uitsluitend na originele onafhankelijke provider- en pagina-readback.

## Server-side toegangsgrens
De bestaande geauthenticeerde Netlify trust endpoint blijft ongewijzigd in route, user- en tenantcontrole maar geeft voor gewone klanten via `_security-trust-customer-projection.mjs` alléén expliciet toegelaten velden terug. Dit voorkomt dat interne technische details via Developer Tools alsnog beschikbaar zijn nadat ze visueel zijn verborgen. Voor admins blijft de oorspronkelijke bronweergave intact. Test: `tests/brain-security-customer-projection-v1.test.mjs`. Geen publieke endpoint, nieuwe secret, rechtenverruiming of extra cron.
