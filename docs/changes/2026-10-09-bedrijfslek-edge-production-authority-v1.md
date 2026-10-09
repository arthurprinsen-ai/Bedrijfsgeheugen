# Bedrijfslek Edge productieautoriteit — 9 oktober 2026

## Bewezen oorzaak
PR #4286 is beveiligd samengevoegd als `eccf6bac`. De Netlify-productie draait die exacte commit en de bestaande Supabase Edge-functie `powerhouse-scan-ingest` draait ACTIVE v12 met byte-identieke GitHub-bron. De canonieke trigger en service-only database-autorisatie zijn in productie teruggelezen. De **bestaande** Powerhouse Scan Production Proof op GitHub run 37977917243 slaagde: een echte gecontroleerde POST leverde scan- en event-ID op, een identieke tweede POST werd gededupliceerd; publieke history/claim bleven verboden.

De afzonderlijke Supabase Edge Production Authority-run 37977917429 faalde uitsluitend op `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:powerhouse-scan-ingest`: de functie ontbrak in `supabase/config.toml`. Daarmee was de automatische productieautoriteit niet structureel reproduceerbaar, hoewel de handmatig herstelde provider-runtime al functioneerde.

## Oplossing
- Voeg **dezelfde bestaande** Edge-functie toe aan de bestaande `supabase/config.toml`; geen tweede functie of schema.
- Gebruik exact `entrypoint = "./functions/powerhouse-scan-ingest/index.ts"` en behoud `verify_jwt=false` uitsluitend omdat de functie elke request via de gehashte private `x-bg-service-token` authenticatie beschermt.
- Netlify's publiek endpoint weigert ongeautoriseerde `history` en `claim`; dat verandert niet.
- Houd acceptatietest op configuratie/source parity, required CI, CodeQL, beveiligde main-merge, readback productieprovider en scan HTTP in de **bestaande** workflows.

## Niet gelijkstellen aan complete omzetlus
Een geslaagde scan = anonieme diagnostische gebeurtenis, geen betaalde conversie. De volledige Heartbeat → commerciële follow-up → uitkomst → Brain-kalibratie onder #4198 blijft pas bewezen na echte klantspecifieke uitkomsten.

Fingerprint: `powerhouse|bedrijfslek|edge-release-authority|v1`
