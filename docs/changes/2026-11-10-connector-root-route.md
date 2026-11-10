# Connector Studio: de bestaande root-API bereikbaar maken

10 november 2026 — Netlify edge-requests voor de officiële productie bevatten **8** verzoeken naar `https://www.bedrijfsgeheugen.nl/api/connectors` die als 404 in de status-404 selectie verschenen. De portalfrontend `assets/js/koppelingen/api.js` gebruikt juist deze basisroute voor lijst en nieuwe Draft. De bestaande geautoriseerde serverhandler ondersteunt `GET /api/connectors` en `POST /api/connectors`, maar de Netlify-functie registreerde alleen `/api/connectors/*`.

**Oplossing in één oorspronkelijke functie:** configureer beide Netlify URLPattern-routes `['/api/connectors','/api/connectors/*']`. De oorspronkelijke tenant-autorisatie via `@netlify/identity`, dezelfde provider-/sovereignty-poorten en de aparte publieke `/api/connectors/readiness` blijven ongewijzigd. Twee bestaande regressietests controleren nu expliciet beide routes en behoud van de readiness-exceptie. Er wordt geen parallel endpoint, opslag of nieuwe AI-executor toegevoegd.

**Verificatie:** beschermde Required + CodeQL + Netlify build → exact commit live op hoofddomein → ongeautoriseerde GET op de root geeft 401, niet 404 of 200 → twee echte geautoriseerde tenants tonen uitsluitend hun eigen connectorlijst en draftbewijs. Een HTTP 401 is correct bewijs dat de root de bestaande Identity-handler bereikt; niet dat klanten echte brondata importeren. Blijf zonder echte provider readback op `UNKNOWN`.

Dit lost niet zelfstandig de 78 pagina's, historische 189 leerverplichtingen, portaal server-outbox of voorspellingen zonder klantdata op; deze blijven onder hetzelfde incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215.
