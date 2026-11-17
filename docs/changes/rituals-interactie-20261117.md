# Rituals-beleving: interactie voor "me time" (site en portaal)

Besluit Arthur 17 nov 2026: rust en exclusieve begeerte; ook interactie, UI en UX. Vervolg op #5975 (website) en #5978 (portaal).

- Nieuw `assets/rituals-beleving.js`, op alle sitepagina's gekoppeld via `tools/bouw-v18-chrome-alles.mjs` en op het portaal via `portal-v2/index.html`.
- Site: langzame onthulling bij scrollen (met vangnet na 6 s), gouden haarlijn-voortgang, zachte paginawissel, hero-boog beweegt licht mee, hover op kaarten.
- Ademmoment (site en portaal): rustig scherm met ademcirkel, drie rondes, Esc of "Verder" sluit; toetsenbord en focus verzorgd.
- Portaal: begroeting naar tijdstip, zachte wissel tussen weergaven, rustig ademende statusmelding.
- Respecteert `prefers-reduced-motion`; zonder JS blijft alles zichtbaar.
- Fout opgelost: letterlijke `\n` in `portal-v2/index.html` (veroorzaakte losse tekst linksboven).
- Geen tekst-, route- of logicawijziging. System Map opnieuw gegenereerd.
- Bewijs lokaal: gedragstest (onthulling, adem open/dicht, begroeting, geen losse tekst, geen scriptfouten) desktop en mobiel; 24 gerelateerde tests groen.
- Niet bewezen: ingelogde portaalweergaven, effect op gedrag of conversie, live-readback tot na merge.

## Herstel na onafhankelijke Required-browsercheck
De eerste beschermde browserrun https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44168414229 faalde 12 keer op exact hetzelfde V18-megamenu-contract: headingkleur was rgb(20,23,26), terwijl zwart rgb(0,0,0) en vet >=700 vereist zijn. De eerdere Rituals-override targette alleen descendants van header.v17-header. Het echte JS-gemarkeerde menu kan echter buiten die header worden geplaatst.

Daarom corrigeert dezelfde bron-PR uitsluitend de selectors voor data-bg-megamenu-root, data-bg-megamenu-heading en data-bg-megamenu-link met voldoende specificiteit. Het gewone menupaneel blijft zwart en vet; de promotiekaart, gewone header en overige nieuwe interacties behouden hun bedoelde stijl. De originele browsercheck is niet afgezwakt. De wijziging is nog niet live: opnieuw exact-head Required/CodeQL, beschermde merge en onafhankelijke Netlify/public browser-readback zijn vereist.

## Herstel van de donkere promotiekaart na browsercontrole
De eerste CSS-correctie loste de witte standaardmenulinks op, maar een tweede daadwerkelijke browsercheck https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44171286227 signaleerde twee donkere promotiekaartkoppen die zwart waren geworden (contrast 1,17:1 en 1,34:1). De oorzaak is de inline gegenereerde V18-megamenustijl die de gewone linkkleur ook over de promotiekoppen liet lopen.
Herstel in dezelfde `tools/bouw-v18-chrome-alles.mjs`: de expliciet niet-gemarkeerde H3-promotiekoppen in het echte `.mega`-paneel blijven wit op donker. Zwart op wit voor gewone links en gemarkeerde menukoppen blijft ongewijzigd. De originele volledige browsercontrole met minimum 3:1 blijft verplicht. Geen nieuwe regels of agenten en geen productieclaim voor geslaagde website-merge.
