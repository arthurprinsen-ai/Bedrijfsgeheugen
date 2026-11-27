# Beveiliging PW Zaalcoach en Bedrijfsgeheugen — 20 november 2026

## Wat echt misging
Een latere rechtstreekse Netlify-publicatie verving twee apppagina's, maar publiceerde **geen headerregels**. Daardoor verdwenen op de openbare PW-pagina's de bedoelde CSP-, framing- en MIME-beveiligingen. De code in GitHub was wel beveiligd, maar de werkelijk getoonde website niet. De browsercontrole bevestigde dit op beide coachroutes én de oude homepage.

## Wat in productie is hersteld
De bestaande beveiligde GitHub→Netlify-uitrol heeft de vier headerregels opnieuw gepubliceerd. Het Netlify-deploybewijs is `6b00c8672aea33df756175fd`; de uitvoeringsrun is https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44828504809 (**success**). Een onafhankelijke controle van HTTPS-responseheaders bevestigt de strenge CSP-hashes, het verbod op externe scripts en clickjacking, en `nosniff`/`no-store`. Geen Make of extra publicatiekanaal is gebruikt.

## Voorkomen dat dit onopgemerkt terugkomt
De bestaande Security Operations Proof krijgt viermaal daags een extra lichte controle van:
1. Bedrijfsgeheugen.nl, inclusief de bestaande productieheaders.
2. De oude PW-homepage op hetzelfde domein als de coach-opslag.
3. PW Zaalcoach.
4. PW Veldcoach.

De exacte live HTTP-headers worden opnieuw gelezen. Ontbreekt een vereiste header, dan faalt de bestaande GitHub-beveiligingscontrole. De al bestaande wekelijkse controle op back-ups, wachtwoordrotatie en IAM blijft apart staan; open punten worden niet als 'groen' voorgesteld.

## Bedrijfsgeheugen en database
De eerder publiek bereikbare interne bronbestanden zijn op de originele site nu aantoonbaar HTTP 404. De homepage en het portaal blijven 200. Alle 208 `public`-tabellen in Supabase hebben RLS. Eén door een lang, SHA-256-gecontroleerd extern bearer-token afgeschermde `SECURITY DEFINER`-cronfunctie is nog via de anonieme API-rol aanroepbaar: dit is een bewuste, maar te verbeteren uitzondering. Aanpassen vereist een bewezen server-to-server vervanging; blind uitschakelen zou bestaande processen raken.

## Wat níét is gegarandeerd
Geen systeem is onhackbaar. Voor een volledige beveiligingsverklaring zijn nog nodig: brede API-misbruik-/belastingstests en rate limiting, gecontroleerde migratie van de externe cronbevoegdheid, MFA/IAM-readback, hersteltest van back-ups, en strengere Bedrijfsgeheugen-script-CSP per pagina. Ook blijft de PW-site openbaar totdat een apart toegangsmodel wordt gekozen.

**Status:** De directe PW-CSP-fout is live opgelost. De viermaal-daagse bewaking is pas actief wanneer de beveiligde GitHub-PR na alle verplichte tests is gemerged en een echte scheduled check geslaagd is. Alle overige punten blijven geregistreerd als open.
