# Eén eigenaar per terminal workflow en gedeeld bestand

Canoniek incident: #4120. Meetplicht: #4661.

PR #4792 is gesloten zonder merge; #4793 is beschermd gemerged op `main`. De bestaande Recovery Supervisor (#4781) en observer (#4793) blijven de enige autoriteit. Geen nieuwe scheduler, CI-dispatcher of foutenregistratie.

De bestaande delivery-hygiene controle vergelijkt voor iedere terminale PR de opgegeven `Change-Scope` met GitHub's werkelijk gewijzigde bestanden. Een oudere, actieve terminale PR met hetzelfde gedeelde bestand of workflow blokkeert de concurrerende nieuwere writer. Gesloten en expliciet retired kandidaten tellen niet mee. Onafhankelijke ontwikkelwerkzaamheden mogen parallel doorgaan.

Dit is een toelatingspoort, geen atomair slot voor gelijktijdige mutaties. De oorspronkelijke supervisor blijft verantwoordelijk voor exacte writer-lease, native `expected_head_sha` CAS, maximaal twee driftpogingen, volledige nieuwe Required/CodeQL-controles na nieuwe head, en onafhankelijke productieverificatie.

De bestaande Janitor houdt herhaalde drift, providerafwijzing, dubbele CI en doorlooptijd bij; verbetering mag pas na onafhankelijke regressie en vergelijkbare prestatiemeting. Geen bewezen productiesnelheidswinst op basis van een enkele CI-run.

Regressie: `tests/brain-shared-terminal-writer-ownership-v1.test.mjs`.
