# Portal V2 — vertraagde spraak-/AI-antwoorden tenantveilig maken

Datum: 2026-11-22
Obligation-ID: portal-v2-voice-async-tenant-boundary-20261122
Delivery-Lane: portal
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6116

## Gevonden foutklasse

Na de bestaande accountwissel-afhandeling kon een reeds gestarte asynchrone `askPortal` nog een oud antwoord of foutmelding tekenen. Browser-`SpeechRecognition`-callbacks konden na abort/close arriveerden zonder verificatie van de oorspronkelijke sessie. Dit is een mogelijk privacy-/interactielek, geen bewezen uitlekincident.

## Scoped wijziging, binnen de bestaande keten

- Eén monotone assistant-epoch voor opeenvolgende opdrachten en identity/dialog/destroy boundaries. Post-await tekst of fout alleen in de actuele open dialoog en bij exact dezelfde geauthenticeerde principal.
- Eén voice-epoch met vergelijking van recognizerobject, dezelfde principal en open dialoog vóór een transcript of fout wordt toegepast.
- Het bestaande `Portal Living Interface`-skillcontract en de bestaande spraaktest borgen deze regels. Er is geen nieuwe browserpoller, cron, tenantstore of agent.
- Gebruiker bevestigt gewone acties nog altijd zelf; providerwrites en gevoelige handelingen blijven native beschermd.

## Afzonderlijke acceptatie

Broncode en testcommit op PR zijn **kandidaat**, geen productie-uitkomst. Vereist: exact-head Required/CodeQL en protected merge, Netlify ready/published op samengevoegde SHA, en geauthenticeerde browserproeven met account A → B tijdens een openstaande AI-vraag, late microfooncallback na close/logout, Safari/iOS en keyboard fallback.

Nog volledig OPEN: nul aangemaakte signaleringsregels, geen geautoriseerde connectoringest bij nul connectoren, geen onafhankelijk geverifieerde notificatiebezorging en geen autonome actieresultaten. Deze reparatie verandert dat niet.
