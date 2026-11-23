# Leestijd-ring weg, case-scenes als rustige reeks

Merkrichting Rituals (17 nov): rust en één detail per scherm. De drijvende leestijd-ring (`.bgx-ring`) stond boven de WhatsApp-knop en dubbelde de gouden voortgangslijn bovenaan; de probleem/ingreep/resultaat-labels op /cases waren gewone vette hoofdletters zonder ritme.

- Wijziging: CSS-laag in `assets/rituals-belevenis.css`; ring verborgen, labels als klein hoofdletterlabel met ruime letterafstand en een haarlijn tussen de scenes. Inhoud en markup ongewijzigd. Cacheversie naar `?v=20261118c`.
- Bewijs lokaal: de CSS over de live /cases gelegd en bekeken; gerelateerde tests groen.
- Niet bewezen: live-readback tot na merge; effect op leesgedrag. Verlies: de ring gaf een leestijd-indicatie; de gouden lijn toont alleen voortgang.
