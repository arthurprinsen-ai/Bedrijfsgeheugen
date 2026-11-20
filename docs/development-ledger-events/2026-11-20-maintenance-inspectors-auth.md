# Onderhoudsendpoints beschermen — 20 november 2026

De Supabase-productiecontrole toonde twee aanvullende kwetsbare authenticatiepatronen bij onderhoudsfuncties:

1. `netlify-live-repair-inspector` gebruikte een vaste toegangscode in de broncode en kon met die code via serverbevoegdheden de Netlify-bestanden opvragen. Die code is verwijderd. Uitsluitend een serverbeheersleutel (`SUPABASE_SERVICE_ROLE_KEY` als Bearer of een moderne geheime `apikey` uit de runtime) geeft nu toegang.
2. `db-recovery-inspect` vergeleek de externe header met de verwachte herstelcode via `header || '' === env || ''`. Als beide leeg waren, kon dit onterecht als geldig worden beoordeeld. De functie vereist nu een aanwezige sterke herstelcode met digestvergelijking, of expliciete serverbevoegdheid. De bestaande sterke `x-recovery-token` blijft voor geldige beheertaken ondersteund.

## Proof / grenzen
- De nieuwe broncode is met 3/3 lokale Node-regressietests geslaagd, inclusief verkeerde, ontbrekende en zwakke credentials.
- Supabase heeft beide functies als **ACTIVE v9** gemeld. De exacte code is onafhankelijk via `get_edge_function` teruggelezen; authenticatie vindt plaats vóór een Netlify-proxy- of databaseactie. De vaste code is aantoonbaar uit de Netlify-inspecteur verdwenen.
- Voor deze twee functies is een externe 401/405 HTTP-readback nog **open**: de onafhankelijke browserdienst gaf gebruikslimiet, de test-sandbox gaf geen toegang tot het domein. Geen echte beheeractie is uitgevoerd om een test te forceren. Claim daarom `LIVE_CODE_PROVEN / HTTP_PENDING`, niet een volledig bewezen uitgevoerde geautoriseerde beheerhandeling.
- In de afgelopen 24 uur waren er geen brongebonden function-logregels met deze namen en er zijn nul `pg_cron`-jobverwijzingen naar deze twee slugs, maar onbekende externe aanroepers kunnen bestaan. Aanroepers moeten zonodig server-to-server keys gebruiken.
- Geen Make, geen nieuw back-end deployment project, geen sleutels in code, logs of browser.
- Scope: twee afzonderlijke herstel-/diagnostiekendpoints. Een `verify_jwt:false`-instelling is niet op zichzelf kwetsbaar; iedere overige Edge Function wordt op haar eigen authenticatie en autorisatie gecontroleerd.
