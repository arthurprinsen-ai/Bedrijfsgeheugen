# Teksten ronde 2: leiding en regie op drie kernpagina's, met Engelse tekst

Vervolg op `teksten-leiding-20261118` (hero homepage). Zelfde vertaling van de opdracht binnen het Rituals-besluit en het SEO-beleid: leiderschap = de ondernemer houdt de leiding; FOMO = eerlijk verlies; geen schaarste, geen marktleider-claim, geen uitroeptekens.

- `/bedrijfsgeheugen` (SEO-pijler): alleen de inleiding. H1, titel, meta, H2's en knoplabels blijven. Nieuw: "De ondernemers die de leiding houden, weten hoeveel ervan in mensen zit ... Wie het nu vastlegt, houdt morgen de regie."
- `/hoe-het-werkt`: "... blijft werken, zodat jij de leiding houdt zonder het zelf te hoeven bijhouden."
- `/over-ons`: "Persoonlijke aandacht, korte lijnen, ..." (geen claim over beperkte capaciteit: die is niet onderbouwd).
- Engelse tekst in dezelfde PR: patch `config/bg-static-i18n-en.d/teksten-leiding-2026-11-18.json` (de productiebuild gebruikt alleen de cache). De cache-completeness-gate faalt zonder deze patch en slaagt met patch (negatieve proef).
- Bewijs lokaal: i18n-gates en hero-copy-test groen.
- Niet bewezen: live-readback NL en EN tot na merge; of de generators de bron-HTML ongemoeid laten (wordt live teruggelezen); gedrags- of zoekeffect.
