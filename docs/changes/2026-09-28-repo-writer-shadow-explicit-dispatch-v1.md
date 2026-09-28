# Repository Writer Candidate Shadow — explicit dispatch v1

## Probleem

Candidate Shadow luisterde naar iedere pull request en controleerde pas in de job of de branch met `writer/` begon. Gewone PR's kregen daardoor een extra workflow-run die alleen `skipped` werd.

## Oplossing

Candidate Shadow is nu uitsluitend `workflow_dispatch`.

Alle 9 canonieke repository writers dispatchen Shadow expliciet nadat de candidate PR bestaat. De dispatch resolveert en valideert:
- PR-nummer;
- exacte base SHA;
- exacte head SHA;
- exacte `writer/...` branch.

De vijf writers die dit nog niet deden zijn toegevoegd: regelgeving-bijwerken, seo-controle, paginacontrole, weekblog en regulatory-source-watch. De vier bestaande expliciete dispatchers blijven ongewijzigd.

## Veiligheid

Er is geen writerbewijs verwijderd: de trigger is verplaatst van globaal/impliciet naar kandidaat-specifiek/expliciet. Een nieuwe writer kan niet canoniek worden toegevoegd zonder de regressie die expliciete Shadow-dispatch eist.
