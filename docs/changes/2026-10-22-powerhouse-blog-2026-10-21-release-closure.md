# Powerhouse dagelijkse blog: herstel en verificatie

De bestaande PR #4570 voor de blog van 21 oktober 2026 liep achter op `main`. De blogindex, RSS-feed en sitemap bevatten op de twee branches verschillende publicaties. Bij het samenvoegen zijn de verwijzingen naar de artikelen van zowel 21 als 22 oktober behouden. De branch is vervolgens met de actuele hoofdbranch samengevoegd, zonder force-push.

De bestaande workflow is aangescherpt zodat een bestaande PR niet vanaf een verouderde checkout opnieuw wordt opgebouwd. De blogexport heeft een expliciete final-copy-goedkeuringscontrole.

**Niet live bewezen.** GitHub Actions run 39834341009 heeft CodeQL succesvol afgerond, maar de verplichte test faalde omdat het activity ledger, de Brain-learningregistratie en deze documentatie ontbraken. Deze drie bestanden sluiten die registratieverplichting in dezelfde PR af; pas een nieuwe geslaagde CI-run, merge en productie-readback bewijzen livegang.

Herhaaltest: beide artikelen exact eenmaal in blogindex, RSS en sitemap; geen verdwenen oudere artikelen; ongoedgekeurde final copy wordt geweigerd; verplichte CI slaagt. Canonieke verplichting: `content-publication:2026-10-21:blog`.
