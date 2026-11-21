# PW MO14-1 — live wisselen en security readback
Datum: 21 november 2026.

## Gebruikersdoel
De coach wijkt tijdens een veldhockeywedstrijd geregeld af van de zes voorbereide wisselblokken. De app moet werkelijk uitgevoerde wissels vastleggen, een teller per speelster tonen, corrigeerbaar zijn en de actuele veldopstelling, bank en minuten verifiëren. Er loopt daarnaast een beveiligingsopdracht voor de PW-site én Bedrijfsgeheugen.

## Implementatie V11
- `pw-mo14-1/zaalplanner/field-live-engine.js`: deterministische event-replay met minute 0..70, 10 veldposities + keeper, actuele bank, speelminuten via tijdsintervallen en in/uit-tellers per speelster. Ingebouwde constraints: Coco-Mijn uitsluitend voorhoede, Isis nooit centraal achter, keeper kan niet ongemerkt als veldspeler op het veld komen.
- `field-live.js` / `field-live.css`: 44+ px mobiele controls voor speelminuut, uitgaande positie, inkomende bankspeler, wissel registreren, fout corrigeren, actueel elftal, bank, speelminuten, in/uit/totaal, minuten-gebaseerd advies, CSV-log en bevestiging van werkelijke eindminuten.
- Veldhockey-wissels zijn **gescheiden van het oorspronkelijke zesblokkenplan**: geen automatisch overschrijven van het basisplan. Live status en eventlog leven uitsluitend onder de geselecteerde veldwedstrijd in `state.fieldCoachV2.matches[i].live`.
- `field-engine.js` sanitizet ingevoerde/persistente gegevens strikt: geldige roster- en positie-ID's, doelverdediger, afwezigheid, tijd 0–70, chronologische gebeurtenisreeks, maximaal 160 mutaties en verbod op dubbelen. Ongeldige imports kunnen geen willekeurige JavaScript of HTML in de eventlog injecteren.
- `sw.js` v11 cachet de drie nieuwe bestanden voor offline gebruik. Provider-levering controleert exact dezelfde bytes voor de drie assets en behoud van homepage/zaalmodus.
- Afsluiten op minuut 70 vereist expliciete bevestiging en schrijft 700 veldminuten plus 70 keepersminuten als `actual.confirmed` in de bestaande seizoensstatistiek. Een wissel op minuut 8 (Isis eruit, Bobbi erin) resulteert bij minuut 19 in Isis 8 en Bobbi 11 veldminuten; Jackie houdt 19 keepersminuten.
- Per persoon betekent de kolom `Wissels` het aantal geregistreerde inzetten én uitgangen samen, met afzonderlijke kolommen `Erin` en `Eruit` om dubbelzinnigheid te voorkomen.

## Productiebewijs
- GitHub Actions `44901696371`: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44901696371, **SUCCESS**, 45 tests geslaagd, 0 mislukt. Provider-HTML, JS/CSS byte-readback, SHA-256 CSP-header, behouden zaal-app en oorspronkelijke PW-homepage apart gecontroleerd.
- Netlify bestaande `pw-mo14-1` site `1c4fa5ce-45ae-45dc-b3e2-11f90587c474`: provider deploy `6b0187cd558ebc318c5ff2d2`, READY. Geen Make of extra deployment-site.
- Onafhankelijke live productie-browsertest `https://pw-mo14-1.netlify.app/zaalplanner/#field`: live UI geladen, Jackie keeper, Coco-Mijn rechtsvoor; start, wijzig minuut, wissel Isis→Bobbi, actuele bank/veld/IN/UIT-teller en minuten gecontroleerd; `Undo` herstelt telling; na 70 minuten worden werkelijke 700+70 minuten vastgelegd; na een volledige reload blijft de registratie aanwezig. Browsertest gebruikte een afzonderlijke testruntime, geen gebruikersbrowser.
- De streng ingestelde `frame-ancestors 'none'` CSP blokkeert cross-origin frame-inbedding. Dat is gewenst tegen clickjacking; de nieuwe live UI heeft geen netwerkverkeer nodig en gebruikt lokaal opslag.

## Security Bedrijfsgeheugen — onafhankelijk opnieuw gecontroleerd
- `https://www.bedrijfsgeheugen.nl/` = HTTP 200; `/portal-v2/` en `/assets/kop.css` = HTTP 200.
- Gevaarlijke repo-/build-bronroutes waaronder `/package.json`, `/supabase/migrations/20261014124402_scoped_external_reconcile_auth_retry_20261014.sql`, `/scripts/security-operations-proof.mjs`, `/.github/workflows/security-operations-proof.yml`, `/tools/security/` = HTTP **404** in een onafhankelijke browsercheck. De forced 404-regels staan op `main` in `_redirects`; de lopende main security-operations-proof workflow controleert deze routes periodiek (schema 47 1,7,13,19 en 17 5 maandag). Geen extra beveiligingsautomatisering aangemaakt.
- Supabase project `adhjwmvyoixzjtmiroln`: security advisors tonen 188 INFO `rls_enabled_no_policy` en één WARN `anon_security_definer_function_executable` voor `public.powerhouse_external_cron_reconcile_v1(p_token text)`. Gecontroleerde grants: anon EXECUTE ja, authenticated nee, service_role ja. De migratie documenteert een gescopeerde SHA-256 bearer-tokencontrole en expliciet toegestane cron-caller. **Niet blind ingetrokken**: ongevraagd revoken zou werkende cron-executie kunnen stilleggen. Blijvende hardening: migreer naar een uitsluitend server-geverifieerde aanroep met onafhankelijke readback, daarna pas de anon-grant verwijderen.
- Dit is geen penetratietest of garantie dat alle aanvalsvlakken schoon zijn. Historische deploy-URL's, beheeraccounts en externe integraties vragen afzonderlijk verder onderzoek. Publicatie van deze app staat los van het niet-gemergde bron-PR #5875.

## Herstel en preventie
- Eerste extra CI-run `44901406565` faalde op vaste oude cacheversie-tests en één verkeerde testverwachting (voorkeurspositie ten onrechte als harde verbodspositie behandeld). Tests gerepareerd; andere vaardigheden van het startschema ongewijzigd.
- Run `44901580291`: bron 45/45 tests groen, provider upload HTTP 401 vanwege verlopen site-specifieke tijdelijke credential. Autorisatie veilig opnieuw uitgegeven, met GitHub publieke sleutel/libsodium versleuteld in `MO14_NETLIFY_PROXY_TEMP` opgeslagen; hetzelfde canonieke direct-to-Netlify-proces herstart, zonder een tweede executor.
- Never mark secure/ready solely on code/CI: require provider ID, byte-identical live readback, security-header readback and interactive browser proof.
