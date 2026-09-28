# Terminal-only user reporting — 28 september 2026

Fingerprint: `delivery|user-facing-reporting|terminal-outcomes-only|v1`.

## Aanleiding
Powerhouse rapporteerde interne GitHub/CI/deploymenttussenstaten in de chat, waaronder ref/PR-synchronisatie, commitidentiteiten, queued gates en "nog niet LIVE_BEWEZEN". Deze informatie hoort bij autonome uitvoering en observability, niet bij de standaard gebruikersdialoog.

## Nieuwe canonieke regel
Interne delivery-state blijft volledig machineleesbaar en fail-closed, maar wordt standaard niet meer in chat getoond. De gebruiker krijgt alleen een terminal bewezen resultaat of, bij een echte externe grens, één minimale noodzakelijke menselijke actie.

Technische details blijven op expliciet verzoek beschikbaar. Een chatonderbreking is geen overdracht van eigenaarschap; recovery hervat vanaf het canonieke checkpoint.

## Borging
De regel is vastgelegd in AGENTS, Powerhouse Continuity, het truth-status-contract, System Map, Brain learning en een executable regression test.
