# Portal V2 bronnenbibliotheek 401 herstel

De Bronnenbibliotheek en externe-intelligencepagina's stuurden geen Netlify Identity bearer-token naar `/api/portal-ondernemersdata`, terwijl de serverless functie `getUser()` gebruikt. De client gebruikt nu dezelfde actieve identity-JWT als de overige beveiligde Portal V2-routes. Een verlopen sessie toont geen technische 401-code meer aan de gebruiker.

Regressiedekking: `portal-v2/tests/entrepreneur-intelligence-auth.test.mjs`.
