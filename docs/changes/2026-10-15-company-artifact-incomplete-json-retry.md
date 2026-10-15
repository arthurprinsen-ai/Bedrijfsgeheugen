# Zakelijke LinkedIn-generator: afgebroken AI-uitvoer veilig herstellen

Datum: 15 oktober 2026.

Voor `linkedin_company` bleef de beslissing `publish` op `decided` staan zonder content. De productiegegevens noemen 13 mislukte generatiepogingen met de JSON-fout `Unterminated string in JSON at position 744`.

De generator krijgt nu één extra kans met een begrensd hoger tokenbudget wanneer OpenAI uitdrukkelijk afgebroken output meldt of de parser uitsluitend een duidelijk onvoltooide JSON-tekst ziet. De tweede poging behoudt dezelfde brongegevens, de oorspronkelijke zes verplichte velden en alle identiteits-, redactie- en verzendbeveiliging. Een niet-parsebaar of onbewezen antwoord wordt nooit gebruikt als definitieve content.

Dit verhelpt de broncodefout, maar **niet** het ongeldige Supabase-deploymenttoken (401), ontoereikend Anthropic-vertaaltegoed (400), de LinkedIn-organisatieautorisatie (403), of de ontbrekende externe publicatiebevestiging. Publicatie en productieacceptatie blijven afzonderlijk te verifiëren.
