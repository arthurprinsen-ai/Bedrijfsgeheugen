# WhatsApp-knop op mobiel: vrij van navigatie en merk-groen

## Wat was er mis?
Op de Frisse Blik-scan van Bedrijfsgeheugen stond de zwevende WhatsApp-knop over de tab 'Mijn bedrijf' in de onderste vierknopsnavigatie. Het pictogram werd donker weergegeven in plaats van WhatsApp-groen. De vaste knop en de nieuwe vaste menubalk hielden geen rekening met elkaars afmetingen.

## Wat is aangepast?
- Het bestaande WhatsApp-icoon krijgt zijn herkenbare groene achtergrond (#25D366) en wit pictogram.
- Op smartphones en tablets wordt het icoon boven de onderbalk geplaatst, met ruimte voor iPhone safe-area.
- Als een pagina zowel het oude als het nieuwe WhatsApp-element heeft, blijft slechts één knop zichtbaar.
- Bij een geopend mobiel menu of invoertoetsenbord verdwijnt het zwevende icoon tijdelijk. Bij het toestemmingsvenster blijft het op afstand.

## Waar moet dit werken?
Alle publieke pagina's met de vierdelige mobiele navigatie, in het bijzonder https://www.bedrijfsgeheugen.nl/frisse-blik. De achterliggende WhatsApp-bestemming is ongewijzigd.

## Hoe wordt dit gecontroleerd?
Regressiecontroles op 320, 390 en 820 pixels verifiëren de werkelijk berekende groene kleur, één zichtbaar WhatsApp-element, geometrische afstand tot de onderbalk en een bruikbaar vierde navigatie-item. De bestaande beveiligde GitHub- en Netlify-route blijft leidend. Er wordt pas 'live' gemeld na een geslaagde beschermde merge, exacte productiedeploy en onafhankelijke mobiele controle.

De eerste CI-runs van PR #6012 blokkeerden terecht op ontbrekende machinevelden en daarna op een ongeldige learning-canary. Het herstel en de drie verplichte documentfamilies blijven bij dezelfde oorspronkelijke PR. Die fouten worden niet genegeerd.
