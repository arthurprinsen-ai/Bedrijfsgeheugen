# Netlify kan niet meer zomaar een onbekende commit publiceren

5 november 2026 · Bestaande eigenaar: GitHub/Netlify-releaseketen  
**Status:** broncorrectie voorbereid; beveiligde CI en nieuwe productiecontrole nog te bewijzen.

## Wat is er gebeurd?
Bij de productiecontrole van Portal V2 publiceerde Netlify kort achter elkaar meerdere deployments met status READY. Twee deployments presenteerden een 40-cijferige commitidentiteit die **niet in de oorspronkelijke GitHub-repository kon worden gevonden**. De bestaande Portal-browsercontrole wees de onjuiste versie terecht af. Uiteindelijk werd de juiste versie gepubliceerd en zijn de oorspronkelijke productietests geslaagd, maar die tussentijdse verwisseling moet worden voorkomen.

## Wat verandert?
De websitebouw heeft al een stap die de broncommit valideert en opslaat in `release.json`. Later schreef de Netlify-buildstap dat bewijs echter opnieuw weg met de lokale `git rev-parse HEAD`. Bij automatisch geassembleerde builds is zo'n HEAD niet altijd hetzelfde als de geautoriseerde GitHub-commit.

De bestaande releasecode controleert voortaan vóór de finale publicatiestempel of de commit echt overeenkomt met dat eerdere bronbewijs. Een bronmarker uit de geautoriseerde workflow of de expliciete commit van Netlify geldt als bewijs. Alleen als er geen van beide is, mag een echte native Git-checkout worden gebruikt, mits de repository-herkomst én `origin/main` aantoonbaar overeenkomen. Een willekeurige lokaal gegenereerde hash mag geen productiebevestiging meer opleveren.

## Grenzen en bewijs
- De reguliere GitHub-PR, Required, CodeQL, BRAIN, Netlify-preview en goedgekeurde release blijven verplicht; niets wordt overgeslagen.
- De bestaande GitHub→Netlify-router blijft de enige releaseketen. Geen tweede scheduler, publisher of afwijkende productie-API.
- Nieuwe regressietests controleren de acht concrete betrouwbare en onbetrouwbare situaties.
- De daadwerkelijke provider-publisher en oorzaak van iedere slechte deployment zijn nog niet volledig geïdentificeerd. Een broncorrectie is geen automatisch productiebewijs.
- De wijziging is pas klaar na beschermde merge, nieuwe juiste Netlify-publicatie, onafhankelijke readback en het uitblijven van dezelfde fout in een volgende natuurlijke uitvoering.

Relevante bestaande herstelregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447  
Historisch geslaagde Portal-acceptatie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547#issuecomment-6653658135

Dit is geen claim dat alle incidenten of menselijke UX-acceptaties groen zijn.
