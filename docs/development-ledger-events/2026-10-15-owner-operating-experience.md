# Development ledger — Powerhouse ondernemersbesturing

Datum: 2026-10-15  
Obligation-ID: powerhouse-owner-operating-experience-20261015-v1  
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4406

## Doel
De vijf gevraagde MKB-taken samenbrengen in de bestaande Portal V2 zonder los dashboard, tweede provider-sender of bypass van beslis-, security-, AI-model- en tenantrechten.

## Uitvoering
- Eén responsive nieuwe route en een compacte ingang in de bestaande overzichtspagina.
- Voor omzet, marge en cashflow bewust geen voorbeeldwaarden of onbewezen prognoses.
- Evidence-gating op tenant, actualiteit, vertrouwen, bronreferenties en outcome-status.
- Binnen beleid vs. goedkeuring vs. alleen inzage, met verwijzingen naar de bestaande besluitketen.
- AI-adviseur op de bestaande geauthenticeerde vraagfunctie zonder provider-fallback.
- Soevereiniteit en AI-keuze via de bestaande governance-interface.
- Regressie op ontbrekende data, XSS, stale/cross-tenant, actiebeleid, vijf gebieden.

## Readback en grenzen
Broncode is op de featurebranch geschreven. Beschermde CI, CodeQL, merge, Netlify en geauthenticeerde productiecontrole blijven eigen acceptatiepoorten. De UI voert geen externe acties uit. Daadwerkelijk klantgebonden finance/CRM-bronbewijs en een consent-driven provider-executor zijn noodzakelijk voordat echte autonome waarde kan worden geclaimd.
