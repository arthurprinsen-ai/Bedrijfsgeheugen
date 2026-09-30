# AI Modelwijzer — CI coverage closure

## Waarom deze wijziging nodig is
De Modelwijzer-regressietests waren wel gecommit, maar drie daarvan werden nergens in de verplichte CI uitgevoerd. Daardoor kon de repository terecht niet bewijzen dat de Modelwijzer duurzaam bewaakt werd.

## Structurele oplossing
De drie ontbrekende regressies zijn toegevoegd aan de canonieke website-lane. Daardoor geldt voortaan: een Modelwijzer-test telt pas als borging wanneer hij daadwerkelijk door Required CI wordt uitgevoerd.

## Geborgde regressies
- modelkeuze/advisorcontract;
- productie-hotfix/buildcontract;
- SEO-clustercontract.

## Closed-loop
De fout is vastgelegd als Brain learning, in het development ledger en in deze menselijke change-documentatie. De bestaande fail-closed testcoverage-guard blijft ongewijzigd actief.

## Live-status
Deze documentatie bewijst de broncode- en governancefix, niet zelfstandig productie. LIVE_BEWEZEN vereist nog steeds merge naar actuele main, Netlify-productie op een commit die deze fix bevat en aansluitende functionele productie-readback.
