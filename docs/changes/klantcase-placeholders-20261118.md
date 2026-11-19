# Homepage: nepbewijs weg

Leesbeoordeling live homepage: onder "Klantbewijs" staan vier kaarten met vijf sterren, verzonnen quotes en de tekst "GERESERVEERD VOOR KLANTCASE". Dat oogt als nepbewijs.
Wijziging: buildstap `tools/site-shell/remove-klantcase-placeholders.mjs` (na lokalisatie) verwijdert de sectie alleen als alle kaarten placeholders zijn; één echte review laat de sectie staan. NL en EN, idempotent. De Nederlandse bron van de sectie staat niet als tekst in de repo (alleen in de i18n-config), daarom is dit een nabewerking in plaats van een bronwijziging.
Niet bewezen: live-readback. Open: echte klantcases verzamelen en toevoegen.
