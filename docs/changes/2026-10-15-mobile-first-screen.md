# Mobiele website: navigatie en eerste scherm

Op basis van de iPhone-beelden van 15 oktober 2026 zijn de belangrijkste mobiele visuele problemen aangepakt in PR [#4392](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4392).

De zwarte bovenbalk met drie USP-regels verdwijnt op telefoons; de site krijgt een compacte header met één **Menu / Sluit**-knop. Het decoratieve pictogram dat op een tweede menu lijkt wordt op mobiel verborgen. De grote homepagekop schaalt mee met de viewport; de gele highlight is voortaan gele tekst zonder blokachtergrond. Hero's op contentpagina's krijgen minder lege ruimte. De zwevende zoektijd-berekening wordt niet langer over het eerste scherm weergegeven; de echte berekening blijft elders toegankelijk.

Deze wijzigingen komen uit de canonieke V18 buildschil. Daardoor worden ze op meerdere publieke routes toegepast en verdwijnen ze niet door de Netlify-transformaties.

**Status:** code en regressietests in PR vastgelegd; CI, beveiligingscontroles, beschermde merge en live-iPhone-readback moeten nog aantoonbaar slagen. Deze registratie is geen productieacceptatie.
