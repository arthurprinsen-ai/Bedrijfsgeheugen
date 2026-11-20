# Extra bescherming van interne websitebestanden

20 november 2026 — Bedrijfsgeheugen en PW Coach

## Wat was het risico?

Bedrijfsgeheugen publiceert vanuit de hoofdmap van de repository. Daardoor konden vóór de oorspronkelijke P0-reparatie sommige interne bronbestanden, waaronder een SQL-migratie en een intern beveiligingsscript, door een bezoeker worden geopend. Dit betekent niet dat er een wachtwoord is gestolen of dat een account is overgenomen.

De oorspronkelijke beveiligingsreparatie is inmiddels **in productie bewezen**: de eerder bereikbare interne bestandsadressen geven HTTP 404, terwijl de homepage, het portaal en de publieke opmaakbestanden gewoon werken.

## Wat voegen we nu toe?

De website weigert voortaan ook met expliciete regels een aantal verborgen en systeemgebonden bestandsadressen, waaronder Netlify-configuratie, Git- en editorinstellingen en tijdelijke buildmetadata. Dit is extra bescherming naast de standaard verborgen-bestandsregels van het hostingplatform.

De bestaande wekelijkse Security Operations Proof controleert deze extra adressen mee. Daardoor wordt een later per ongeluk terugkerende publieke toegang zichtbaar als een mislukte beveiligingscontrole.

## Wat is onafhankelijk gecontroleerd?

- Bedrijfsgeheugen: echte productiepagina en portaal HTTP 200; bekende interne SQL-, CI-, configuratie- en documentbestanden HTTP 404.
- PW Coach: strikte browserbeveiliging (Content Security Policy) op zaal en veld, HSTS en no-sniff. Een onschuldig, niet toegestaan inline script werd in de echte browser tegengehouden.
- Supabase: bestaande jeugdopstellingen en beoordelingen kunnen niet met anonieme of gewone ingelogde clientrollen worden gelezen of gewijzigd. De gegevens in de Zaalcoach worden op het apparaat opgeslagen.
- Een geteste oude Bedrijfsgeheugen-deploylink leidde naar Netlify-teambeveiliging in plaats van rechtstreeks naar de interne SQL-migratie.

## Wat is nog niet afgerond?

De regels in deze aanvullende wijziging zijn nog een **PR-kandidaat** totdat de beschermde GitHub-merge en nieuwe Netlify-publicatie voltooid zijn, gevolgd door een onafhankelijke livecontrole. De bestaande productiebeveiliging blijft tijdens die beoordeling actief.

Er zijn drie structurele vervolgpunten: de publieke website vanuit een expliciete lijst met publiceerbare bestanden bouwen in plaats van de hele repositoryhoofdmap; de volledige script-CSP op Bedrijfsgeheugen activeren nadat de bestaande scripts en externe koppelingen compatibel zijn; de publiek aanroepbare maar met geheim token beveiligde cron-databasefunctie migreren naar een server-only uitvoerder, waarna de anonieme toestemming kan worden ingetrokken zonder de geplande taken stil te leggen.

De PW-app zelf is een publiek toegankelijke coachpagina waarop teaminformatie zichtbaar kan zijn. Een aanmelding of sitewachtwoord vergt een aparte toegangskeuze voor coaches en ouders. Beveiligingsmaatregelen verminderen aanvallen, maar vormen geen garantie tegen alle mogelijke hacks.
