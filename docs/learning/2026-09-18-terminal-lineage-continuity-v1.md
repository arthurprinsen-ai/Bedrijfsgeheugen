# Terminal lineage continuity — 2026-09-18

Incident: PR #2044 en opvolger #2053 veranderden tijdens actieve terminal delivery van state. #2053 eindigde gesloten zonder merge. De chat detecteerde dat correct, maar runtime hygiene kon een actief leased PR nog niet automatisch herstellen.

Nieuwe regel: een `Writer-Lease-State: TERMINAL_DELIVERY` lineage mag niet stranden door een PR-statewijziging.

- gesloten + unmerged + geen successor → AUTO_REOPEN;
- exact één open same-obligation successor → reuse;
- meerdere successors → fail-closed;
- merged/released/cancelled → normale terminale afhandeling.

Chats en agents stoppen niet op de state transition zelf: ze refreshen de canonical authority en vervolgen de enige geldige lineage.

Fingerprint: `delivery|terminal-lineage|closed-unmerged-chat-stop-v1`.

## PR #2070 vervolgleren

Tijdens dezelfde terminal-delivery lineage kwamen drie aanvullende failure classes naar voren:

- een incrementele testwijziging introduceerde een dubbele `fs`-import;
- een stale test-oracle bleef `sources.length <= 64` afdwingen terwijl het canonieke contract bewust naar 96 bronnen was verruimd;
- de writer lease wees na een legitieme owner-commit nog naar de vorige exact-head en admission blokkeerde terecht met `BLOCKED_TERMINAL_LEASE_HEAD_DRIFT`.

Daaruit volgen permanente regels: test-oracles moeten het actuele canonieke contract volgen; na elke same-lineage owner-commit wordt de writer-lease-head direct gereconcilieerd; pending required checks worden nooit omzeild. Een beschermde merge die op een ontbrekende required status wordt geweigerd is correct gedrag en blijft een recoverable incomplete state totdat dezelfde lineage terminal groen is.

Actuele bewezen kandidaat-evidence: Chat-learning preflight groen; Netlify deploy-preview ready op exact head `c82c22e6ff543450ab9548831a51b916dc583cb3`; secret-scan zonder matches; protected merge nog terecht geblokkeerd zolang required status `test` niet terminal groen is.
