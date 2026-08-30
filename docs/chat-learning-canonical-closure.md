# Canonical chat-learning closure

Materiële learning uit chats is pas team-beschikbaar wanneer de primaire `BRAIN-CHAT-LEARNING-v1` preflight-index de guard/source zelf canoniek laadt. Een los contractbestand op `main` is onvoldoende als toekomstige agents het niet via de verplichte preflight ontdekken.

Invariant:
- `config/chat-learning-completeness-guard.json` staat in `config/brain-chat-learning-contract.json.canonicalSources`;
- `config/browser-evidence-guard-contract.json` staat in dezelfde canonical source set;
- de browser-evidence development learning staat in dezelfde canonical source set;
- regressietests blokkeren removal of ontkoppeling;
- completion blijft fail-closed als materiële learning alleen in chat of in een niet-geïndexeerd bestand bestaat.

Fingerprint: `learning|canonical-index|guard-exists-but-preflight-does-not-load-it`.

Root cause class: persistent knowledge existed, maar was niet gegarandeerd onderdeel van iedere verplichte agent-preflight.

Prevention: iedere nieuwe canonical guard/source moet via een contracttest aantoonbaar door de primaire preflight-index worden geladen voordat de learning als volledig geborgd wordt beschouwd.
