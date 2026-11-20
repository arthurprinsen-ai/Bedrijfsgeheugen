# PW MO14-1 Coach — één app voor zaal en veld

**Datum:** 20 november 2026  
**Canonieke URL:** https://pw-mo14-1.netlify.app/zaalplanner/  
**Veld-deeplink:** https://pw-mo14-1.netlify.app/zaalplanner/#field  
**Oude Veld-URL:** https://pw-mo14-1.netlify.app/veldplanner/ (verwijst automatisch naar de veld-deeplink)

## Gebruikersverzoek en productbesluit
De eerdere zaalcoach en veldplanner moeten één echte app-ervaring vormen, zonder een iframe, tweede losse mobiele shell of nieuwe Netlify-site.

De canonieke PW MO14-1 Coach heeft nu één startscherm, een bovenste Zaal/Veld-schakelaar, dezelfde onderste navigatiebalk, dezelfde branding en één installeerbare PWA. De zaalfuncties behouden hun eigen wedstrijden, keepers, afwezigen, automatische wissels, gespeelde minuten, kladblok/tactiekbord en downloads. Een nieuwe `field`-view toont de bewezen zes veldhockeyblokken direct binnen dezelfde bestaande applicatie. De oorspronkelijke aparte veldpagina is nu een veilige alias/doorverwijzing. Bij een tabwissel vindt geen paginareload plaats.

## Geborgde invarianten
- Zaal: twaalf wedstrijden op zes zichtbare speeldagen, zes spelers inclusief keeper, afzonderlijke planning per wedstrijd, keeper/afwezigen en wissels blijven intact.
- Veld: zes blokken 0–12, 12–24, 24–35, 35–47, 47–59, 59–70 minuten; 11 speelsters inclusief keeper; twee tegelijk op de bank; bank/eruit/erin zichtbaar op elke plaat.
- Veld: Jackie blijft 70 minuten keeper, Coco-Mijn speelt uitsluitend als voorhoedespeler of rust; Nine begint in de aanval, Isis nooit centraal achter; gemiddeld 58–59 minuten voor veldspeelsters.
- Zaaldata blijven onder de oorspronkelijke `mo14_zaal_v2` localStorage-sleutel, de geselecteerde veldwissel onder `pw_mo14_field_block`. Geen stille reset of duplicerende dataopslag.
- Alle veld- en zaalscripts blijven same-origin en worden door de bestaande SHA-256-gebaseerde strikte Content Security Policy beschermd, zonder `unsafe-inline` JavaScript of `unsafe-eval`. Frame-ancestors blijven `none` en `X-Frame-Options` blijft `DENY`.
- De service worker registreert uitsluitend binnen de scope `/zaalplanner/` en cachet nu ook `field-unified.js` en `field-unified.css`. Oude zaal- en gecombineerde appcaches worden op activatie opgeschoond.
- Geen Make, geen nieuwe Netlify-site, geen wijzigingen aan de oorspronkelijke homepage.

## Productiecontrole
- Source-test met exact zichtbare data en gesimuleerde module-interactie: `tests/mo14-unified-zaal-veld-app-20261120.test.mjs`.
- De bestaande zaalcoach-regressie, veldroster/keeper-minuten-tests, CSP-beveiligingstest en nieuw integratietest zijn in één strikte GitHub Actions-release uitgevoerd.
- Geverifieerde release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44770389357 — **SUCCESS**, inclusief onafhankelijke HTTP/readback van beide URL's, alle nieuwe assets, CSP-headers, icons en de onveranderde legacy homepage.
- Netlify-provider: bestaande site `pw-mo14-1` (`1c4fa5ce-45ae-45dc-b3e2-11f90587c474`), deploy `6b0070a947d9dfa0442cf4dd` — **CURRENT/READY**.
- Interactieve productiebrowser: van Start via onderste navigatie naar Veld, zes wisselblokken/zes printplaten, Jackie/Coco-Mijn/Nine zichtbaar, veldkaart en bankinformatie; terug naar Zaal zonder nieuwe pagina, zaalkeeper en wisselinterval behouden. De oude Veld-URL stuurt daadwerkelijk door naar de nieuwe deeplink met de `field`-view actief.
- Live service worker `activated`, manifest/CSS/JS allemaal HTTP 200, strikte CSP met `frame-ancestors 'none'` en `script-src-attr 'none'` geverifieerd.
- Een browsermobiel-iframe op 390 px kon vanwege de beoogde `frame-src 'none'` CSP niet worden gebruikt; CSS bevat wel expliciete kleine-schermregels, maar deze controle telt niet als geslaagde visuele iPhone-test.

## Incidenten en herstel
1. Eerste workflow had vier falende legacy-tests omdat de oude PWA-naam en directe Team-tab waren vervangen. Testverwachtingen gecorrigeerd op één nieuwe Veld-tab met Team via het echte menu; beveiligings- en functionele asserties behouden.
2. Offline-cacheopruiming filterde enkel historische `mo14-zaalcoach-` sleutels. Uitgebreid naar beide naamfamilies om oude iPhone-cacheversies niet te laten hangen.
3. Eerste upload werd vóór productie gestopt door verlopen tijdelijke Netlify-autorisatie. De autorisatie is uitsluitend via de bestaande sitegebonden connector opnieuw verkregen, met GitHub repo public-key-versleuteling opgeslagen en vanuit de bestaande Actions-workflow gebruikt. Geen geheimen in broncode of logs.
4. Oud-veld-link was een aparte app; nu een HTML fallback met duidelijke volledige URL en directe clientredirect naar het ene canonieke appscherm, met eigen exact gehashte CSP.

**Niet claimen:** volledige bescherming tegen alle hacks, cloudsync of een dynamische veld-uitvalplanner. De huidige veldblokken zijn een bewezen vaste basis; de zaalplanner heeft de aanpasbare selectie. De bredere parent-repository-PR blijft een eigen beveiligde mergehandeling en is niet door de sitepublicatie afgerond.
