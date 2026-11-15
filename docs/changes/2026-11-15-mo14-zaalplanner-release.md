# MO14-1 zaalplanner — veilige publicatie zonder Make

De bestaande Netlify-site `pw-mo14-1` moet worden uitgebreid met een zaalplanner onder `/zaalplanner/`, zonder andere MO14-pagina's te verwijderen.

De app ondersteunt een wisselende keeper, afwezigen, voorkeurslinies, vijf veldposities in dobbelsteenformatie, bank per blok, wisselrotatie tussen zeven wedstrijden en PDF/PNG-export.

## Herstel aan de bron

Dezelfde PR #5875 corrigeert ontbrekende machineleesbare metadata, registreert exact het nieuwe plannerpad in de bestaande website-deliverylane, en draagt de verplichte les, regressietest, menselijke changenotitie en ontwikkellog. Geen policy-bypass, geen Make, geen parallelle publicatieketen.

## Veiligheids- en publicatiegrenzen

De Bedrijfsgeheugen Netlify-preview is **niet** de aparte MO14-site. Ook de oude MO14-provider-deploy is geen bewijs voor de nieuwe planner. Na alle verplichte GitHub-checks moet een Netlify-productie-upload de huidige sitebestanden **behouden** en de planner toevoegen. Alleen een onafhankelijke provider-readback plus werkende keeper-/afwezigheidskeuzes en PDF/PNG-export tellen als voltooid.

## V4 — echte mobiele menuhiërarchie

- Gebruik de officiële Apple-richtlijnen voor een beperkt aantal vaste tabs: **Start, Veld, Selectie, Minuten, Menu**; labels onder herkenbare iconen, vaste onderste balk op iPhone. Bron: https://developer.apple.com/design/human-interface-guidelines/tab-bars.
- Start toont de huidige keeper, aantal aanwezigen, bankbezetting, eerstvolgende wissel en zeven selecteerbare wedstrijdkaarten. De gekozen wedstrijd opent daadwerkelijk het veld met de bestaande berekende opstelling.
- Menu bevat functionele bestemmingen voor Start, Veld, Selectie, Speeltijden, Downloads, Instellingen en installatie. Het hamburgericoon opent een modal app-lade met dezelfde navigatie. Niet-bruikbare decoratieve items zijn verboden.
- Instellingen zijn uit de selectiepagina gehaald en als een apart geopend instellingenscherm beschikbaar gemaakt; IDs en oorspronkelijke berekenings-/downloadlisteners blijven behouden. Overgangen ondersteunen URL-hashes en browser-terugnavigatie.
- PWA cacheversie `mo14-zaalcoach-v4`, drie manifest-snelkoppelingen (Start, Veld, Team), bestaande serviceworker-scope uitsluitend `/zaalplanner/` en originele iconen behouden. 
- Browserregressie op 390×844: zeven wedstrijdknoppen, hoofdnav, modal menu, downloads, keeper op Nine, Jackie afwezig, instellingen, dobbelsteen-vijf (5 veld + 1 keeper), PNG-export, history-back en geen JavaScript-fouten. De lokale test is **geen** live browseracceptatie.
- Uitrol uitsluitend door bestaande GitHub Actions → bestaande Netlify-site `pw-mo14-1`, zonder Make en zonder hoofdwebsite te wijzigen; pas na provider READY, exacte assetreadback en onveranderde homepage live melden.
