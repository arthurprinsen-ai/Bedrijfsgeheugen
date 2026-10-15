# Development ledger — geverifieerde ondernemerscijfers en besluiten
Datum: 2026-10-15  
Obligation-ID: powerhouse-owner-operating-finance-and-decision-20261015-v2  
Basis: #4405 / beschermde merge #4406  
Opvolging: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4407

## Reikwijdte
- Canonieke /api/portal-forecasts levert nu ook tenantId voor geen/lege geverifieerde reeks.
- Mijn bedrijf vraagt op de ingelogde en door de server afgebakende tenant prognoses op; een los website- of marktgetal wordt nooit omzet, marge of kasprognose.
- Historisch vastgestelde bronwaarden en vooruitgeschatte perioden worden onderscheiden. De forecast bron wordt pas weergegeven bij aantoonbare zes waarnemingen, actuele review en status passed.
- Mijn acties toont beslissingen uit bestaande Brain-projectie; alleen expliciete APPROVE of REJECT, geen impliciete externe provideruitvoering.
- Besluitcommando's gebruiken een idempotente sleutel en worden opnieuw gelezen uit de beveiligde projectie.
- De compacte vijf overzichtsingangen openen hun respectievelijke tabbladen, niet vijf keer dezelfde standaardtab.

## Controle
Regressiecontract `tests/portal-owner-financial-truth.test.mjs`, bestaande `tests/portal-v2-owner-operating-system.test.mjs`, plus historical/shadow/canary-evaluatie met Brain-contract.

## Blokkades
Supabase ondervond in deze sessie opnieuw verbindings-time-outs. De voorgaande productie-HTTP-504 en visuele preview-HTTP-500 zijn reëel. Deze implementatie garandeert niet dat financiële klantbronnen bestaan of dat provideracties uitvoerbaar zijn. Verifieer Required CI, CodeQL, protected merge, exact production deploy en authenticated customer readback onafhankelijk.
