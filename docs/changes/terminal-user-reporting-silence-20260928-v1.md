# Terminal-only user reporting — 28 september 2026

Fingerprint: `delivery|user-facing-reporting|terminal-outcomes-only|v1`.

## Aanleiding
Powerhouse rapporteerde interne GitHub/CI/deploymenttussenstaten in de chat, waaronder ref/PR-synchronisatie, commitidentiteiten, queued gates en "nog niet LIVE_BEWEZEN". Deze informatie hoort bij autonome uitvoering en observability, niet bij de standaard gebruikersdialoog.

## Nieuwe canonieke regel
Interne delivery-state blijft volledig machineleesbaar en fail-closed, maar wordt standaard niet meer in chat getoond. De gebruiker krijgt alleen een terminal bewezen resultaat of, bij een echte externe grens, één minimale noodzakelijke menselijke actie.

Technische details blijven op expliciet verzoek beschikbaar. Een chatonderbreking is geen overdracht van eigenaarschap; recovery hervat vanaf het canonieke checkpoint.

## Borging
De regel is vastgelegd in AGENTS, Powerhouse Continuity, het truth-status-contract, System Map, Brain learning en een executable regression test.

## Versterking: uitvoering mag ook niet stoppen

Fingerprint: `delivery|terminal-continuation|no-internal-handoff|v2`.

De eerdere regel over terminal-only rapportage wordt aangescherpt: niet alleen de melding verdwijnt, ook het onderliggende eigenaarschap blijft bij Powerhouse. Interne GitHub-, CI-, Netlify-, Supabase-, provider- of readbacktoestanden zijn recovery-state. De uitvoerende node blijft dezelfde lineage autonoom vervolgen totdat een bewezen terminale toestand is bereikt. Een app-/chat-time-out is geen annulering en vereist geen nieuw “ga door”-bericht van de gebruiker.
