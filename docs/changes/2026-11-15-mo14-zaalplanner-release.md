# MO14-1 zaalplanner — veilige publicatie zonder Make

De bestaande Netlify-site `pw-mo14-1` moet worden uitgebreid met een zaalplanner onder `/zaalplanner/`, zonder andere MO14-pagina's te verwijderen.

De app ondersteunt een wisselende keeper, afwezigen, voorkeurslinies, vijf veldposities in dobbelsteenformatie, bank per blok, wisselrotatie tussen zeven wedstrijden en PDF/PNG-export.

## Herstel aan de bron

Dezelfde PR #5875 corrigeert ontbrekende machineleesbare metadata, registreert exact het nieuwe plannerpad in de bestaande website-deliverylane, en draagt de verplichte les, regressietest, menselijke changenotitie en ontwikkellog. Geen policy-bypass, geen Make, geen parallelle publicatieketen.

## Veiligheids- en publicatiegrenzen

De Bedrijfsgeheugen Netlify-preview is **niet** de aparte MO14-site. Ook de oude MO14-provider-deploy is geen bewijs voor de nieuwe planner. Na alle verplichte GitHub-checks moet een Netlify-productie-upload de huidige sitebestanden **behouden** en de planner toevoegen. Alleen een onafhankelijke provider-readback plus werkende keeper-/afwezigheidskeuzes en PDF/PNG-export tellen als voltooid.
