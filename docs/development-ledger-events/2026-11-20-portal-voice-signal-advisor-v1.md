# Ontwikkelingslogboek — spraak en alert-advies in Portal V2

- Datum: 20 november 2026
- Obligation-ID: portal-v2-voice-signal-advisor-v1
- Delivery-Lane: portal
- Candidate-Type: implementation
- Base-SHA: 63894d9e5db0b5b07623030c58825cea473615be
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6082
- Status: SOURCE_CANDIDATE / NOT_LIVE

## Gebruikersvraag, uitvoering en eigenaarschap

Één bediening voor gesproken opdrachten, KPI-afwijkingen, zelf ingestelde grenzen, verklaarbare bronnen, advies en een opvolgtaak met eigenaar en deadline. Bestaande Portal State, BusinessInput, ONE BRAIN, Powerhouse, Heartbeat en router blijven leidend. Nieuwe bestanden bieden browsergebaseerde spraakherkenning, typen als fallback, opt-in voorlezen, allowlisted KPI-regels, missing-data-proof en klantgebonden taakopslag.

## Vastgestelde fouten en preventie

Eerste CI faalde door ontbrekende machine-metadata op de PR (PR_MACHINE_METADATA_INVALID). Na herstel toonde de volgende CI de verplichte ontbrekende integratiebewijzen activity_ledger en brain_learning. Dit ledger, leerrecord en historische regressietest worden in dezelfde oorspronkelijke PR aangeleverd. Geen false-green, geen verzonnen klantwaarden, geen onbewijsbare actie of achtergrondsignalering.

## Nog te bewijzen

- unit tests Portal V2 en historische Brain-regressie
- Required CI, CodeQL en eventuele beschermde merge
- Netlify productie met exact overeenkomende merge SHA
- Browserreadback op https://www.bedrijfsgeheugen.nl/portal-v2/ inclusief iOS fallback
- 24/7 Heartbeat en kanalen voor e-mail/push: niet geleverd en niet als live claimen

Financiële effectmeting: niet beschikbaar.
