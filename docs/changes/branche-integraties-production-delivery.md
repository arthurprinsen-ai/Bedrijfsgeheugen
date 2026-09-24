# Branche-integraties: delivery- en releasecontract

Voor alle nieuwe branche-applicatiepagina's geldt:

1. Registreer publieke pagina's in de website delivery-classifier.
2. Elke regressietest moet expliciet door CI worden uitgevoerd.
3. Gebruik bestaande Portal Data/Koppelingen-navigatie tenzij een bewuste top-level navigatiecontractwijziging nodig is.
4. `available` of `koppelbaar` is niet hetzelfde als `ready` of `healthy`.
5. Een release is pas live bewezen wanneer protected main via de canonical Production Source Snapshot is gepromoveerd en productie exact dezelfde SHA terugrapporteert.
6. Een `401 Unauthorized` op de Netlify MCP proxy is een credential-expiry blocker, geen reden om een deploy als geslaagd te markeren.
