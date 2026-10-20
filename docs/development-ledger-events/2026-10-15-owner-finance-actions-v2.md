# Development ledger — MKB-eigenaar: financiële waarheid en acties

Datum: 2026-10-15  
Obligation-ID: powerhouse-owner-operating-finance-and-decision-20261015-v2  
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4407

## Aanleiding
De visuele ondernemerservaring van PR #4406 is samengevoegd en Netlify publiceerde SHA 7c34bb0317456282aaa76abdee383acc7f716963. De onafhankelijke authenticated production-readback faalde echter op 504 (database-/Edge-gateway); de DOM-preview kon een immutable alias niet bereiken (HTTP 500). Er mag dus geen bewezen werkende klant-acceptatie worden geclaimd.

## Wijzigingen
- De bestaande server-identity scope autoriseert een financiële forecast-respons met expliciet tenantId.
- De portaalpagina toont uitsluitend actuele, geverifieerde historische financiële waarden en gecontroleerde voorspellingen met bron- en tijdlabels.
- Canonieke Brain-besluiten kunnen na expliciete gebruikersactie worden goedgekeurd of afgewezen, waarbij de server autorisatie, expected state en idempotency afdwingt.
- Compacte ingangen schakelen naar het gekozen tabblad.
- Zonder bewijs worden geen KPI's geschat, geen providers aangeroepen en geen acties als uitgevoerd geregistreerd.

## Controlegrens
Beschermde CI + CodeQL, exact-head merge, Netlify-publicatie en onafhankelijke geauthenticeerde production-readback. De vorige HTTP 504 en preview HTTP 500 blijven aparte operationele blockers zolang ze niet in nieuwe, onafhankelijke readback zijn opgelost.
