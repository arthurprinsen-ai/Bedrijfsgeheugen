# 2026-10-23 — CI-browserknelpunt: fail-closed viewport-matrix

- **Canonieke eigenaar:** #4661. Eén bestaande `Required test` → `lane-website`-keten.
- **Waarneming:** onafhankelijke succesvolle GitHub-run 39938653908: browser 225 s, totaal 339 s. Run 39939651165: browser 223 s, totaal 355 s; backend respectievelijk 11 en 14 s. 63–66% van de totale kritieke doorlooptijd lag bij de browserjob. Geen gemeten versnellingsresultaat beschikbaar vóór huidige PR.
- **Hoofdoorzaak:** bestaande Playwright-sweep voert alle sitemaproutes voor telefoon/tablet/desktop na elkaar uit in een single job; `main` veranderde tussentijds bij meerdere bestaande agents.
- **Herstel:** dezelfde individuele publieke-routetests voor ieder schermformaat in drie matrixjobs, exacte kandidaatboom, originele selectieregels en CLS-maximum behouden. De originele browserjob behoudt de checkout-/navigatie-/menu- en high-risk tests. Onbekende shard = fout.
- **Preventie:** bestaande source + matrix-regressies, verplichte Required en CodeQL, geen extra scheduler of beschermingsuitzondering, geen groen op onvolledige matrix.
- **Vervolg:** meet volledige providerwalltime en regressies ná beschermd samenvoegen; claim geen snelheid of autonome omzetwinst zonder onafhankelijk readback.
