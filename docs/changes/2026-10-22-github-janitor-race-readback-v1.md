# 22 oktober 2026 — veilige GitHub-schoonmaak zonder foutieve 404 en reopen

Obligation: `github|repository-cleanup-race-readback|20261022-v1`
Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4656

De Repository Hygiene job #39755226803 faalde op een `compare` 404 doordat een inmiddels verwijderde `writer/paginacontrole/...` ref nog in een eerder opgehaalde branchinventaris stond. Vergelijkings-404 wordt nu uitsluitend overgeslagen na een afzonderlijke bewezen 404 bij het opvragen van precies dezelfde branch. Andere fouten blokkeren onveranderd.

Repository Janitor job #39761281487 sloot #3995 en opende die in dezelfde run weer met expliciet `AUTO_REOPEN_TERMINAL_LEASE` bewijs; de oude readback verwachtte toch `closed` en werd rood. Alleen deze exact geregistreerde, apart op `open`/`unmerged` gecontroleerde uitzondering wordt nu aanvaard.

Expliciet RETIRED terminal-lease PRs worden nooit door janitor automatisch heropend. Dit voorkomt terugkerende werkvoorraad. Geen Required test, CodeQL, branchveiligheid of releasepoort is uitgeschakeld.

Status: kandidaat; pas groen na onafhankelijke CI, beveiliging, beschermde merge en vervolgcontrole.
