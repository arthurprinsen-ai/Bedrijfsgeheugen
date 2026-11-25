# Herstel dagelijkse social-publicaties met bewezen aflevering

Datum: 15 oktober 2026  
Obligation: `social-outbound-recovery-20261015`  
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4391

De bestaande herstelroute voor LinkedIn/Instagram was niet autonoom betrouwbaar: een ontbrekende `bearer`-functie laat de herstelrun mislukken en de GitHub-workflow was niet periodiek gepland. Bovendien zou een nieuw tijdschema ten onrechte de datum uit de historische handmatige herstelregistratie overnemen.

Deze kandidaat corrigeert tokenparsing, voegt onafhankelijk geplande herstelruns toe, en gebruikt voor automatische runs altijd de actuele Nederlandse datum. De nieuwe regressietest beschermt deze contracten. Bestaande beveiliging, beoordeling vóór publicatie, duplikaatbeveiliging en providerreadback blijven intact.

Status: bronwijziging in review. Niet aannemen dat een bericht extern afgeleverd of dat productie gewijzigd is voordat verplichte checks, merge en productiecontrole dat bevestigen. SalesRobot-abonnement, LinkedIn-bedrijfspaginarechten, Instagram-media en e-mailautorisatie blijven aparte grenzen.
