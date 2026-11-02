# Development-ledger — BRAIN backend case 3050 / Portal dubbele bewijslabels

2026-11-02 · Parent #4439 · fingerprint powerhouse|brain|dual-observation-ui-label-fixture-drift|20261102-v1.

Waarneming: originele BRAIN #41433667027 / job 125238718390, 5.400 totaal / 5.397 geslaagd / 1 gefaald / 2 overgeslagen. Fout: een oudere broncodeassertie verwachtte één label dat bewust door de oorspronkelijke admin Portal-owner in #5282 in twee semantisch nauwkeurigere labels is veranderd.

Root cause: testtekst en productie-UI lopen uiteen. Herstel: in dezelfde bestaande BRAIN-regressietest de historische mislukte run én afzonderlijke geregistreerde herstelproef assertief toetsen, samen met bestaande absolute URL, auth en negatief commercieel bewijs. Oorspronkelijke post-merge agent skill aangepast; machine learning bevat uitvoerbare evaluatiemodes. Geen parallel proces, niet direct naar main schrijven, geen providerresultaat verzinnen.

Acceptatie: exact-head historische/shadow/canary en volledige BRAIN 0 failures; Required+CodeQL; beschermde merge; onafhankelijke volgende main-run zonder herhaling. Kandidatenstatus OPEN tot bewezen.
