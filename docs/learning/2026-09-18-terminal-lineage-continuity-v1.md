# Terminal lineage continuity — 2026-09-18

Incident: PR #2044 en opvolger #2053 veranderden tijdens actieve terminal delivery van state. #2053 eindigde gesloten zonder merge. De chat detecteerde dat correct, maar runtime hygiene kon een actief leased PR nog niet automatisch herstellen.

Nieuwe regel: een `Writer-Lease-State: TERMINAL_DELIVERY` lineage mag niet stranden door een PR-statewijziging.

- gesloten + unmerged + geen successor → AUTO_REOPEN;
- exact één open same-obligation successor → reuse;
- meerdere successors → fail-closed;
- merged/released/cancelled → normale terminale afhandeling.

Chats en agents stoppen niet op de state transition zelf: ze refreshen de canonical authority en vervolgen de enige geldige lineage.

Fingerprint: `delivery|terminal-lineage|closed-unmerged-chat-stop-v1`.
