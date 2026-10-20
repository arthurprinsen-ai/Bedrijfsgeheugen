# Portal AI-modellen en koppelingen — geauthenticeerde doorwerking

## Wat verandert
Een aangemelde klant gebruikt het bestaande portaal om een AI-model te selecteren of een veilige koppeling aan te maken. Beide functies sturen voortaan hetzelfde geldige bearer-token mee dat de canonieke Portal V2 state gebruikt. Zonder token stopt de aanvraag vóór het verzenden van klantgegevens. De Netlify connector-runtime leest de werkelijke gebruikersidentiteit uit de inkomende Request.

Bij selectie van een AI-model of indienen van een activeringsaanvraag krijgt de bestaande impact-engine de juiste bronpagina `ai-modelkeuze`. De bestaande domeinstate en Brain-writeback tonen de relevante afhankelijkheden bij Data & AI Passport, Trust Center, koppelingen, compliance, finance, roadmap, advies en Powerhouse Control Center.

## Bewijsgrens
- AI-modelkeuze is een voorkeur, geen providerverbinding en geen activatie. De bestaande `/api/tenant-ai-activation-status` beslist onafhankelijk of een tenant veilig klaar is voor een daadwerkelijke test.
- Connector `Draft` is niet `Active`. Testen/activeren blijft gebonden aan tenant-geauthenticeerde servercalls en persistente execution evidence.
- Een gemarkeerde financiële of governance-impact is **herbeoordeling vereist**, geen doorgerekend financieel effect of compliance-certificaat.
- De cache van leverancierstatus (83 VERIFIED/26 PARTIAL/1 CONFLICT) is niet gelijk aan het aantal echt uitvoerbare, goedgekeurde providers.

## Regressie en rollout
De regressie dekt signed en unsigned requests, modelkeuze en activeringsaanvraag, en de bestaande Brain-impactmetadata. Verifieer vóór productie: exact-head Required/CodeQL, onafhankelijke Netlify preview, protected merge, daarna echt geauthenticeerde tenant-A/tenant-B readback met isolatie, Brain ACK, route- en providerverificatie. Houd issue #4215 open voor alle overige invoervelden, alle externe bronverversingen, financiële forecasting, en historische reconciliatie. Geen gefingeerde success receipts.
