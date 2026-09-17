# Powerhouse Universal Completion v1

## Doel
`POWERHOUSE-UNIVERSAL-COMPLETION-v1` maakt volledige borging een machine-afdwingbare terminale voorwaarde voor alle huidige en toekomstige materiële Powerhouse chats, agents, workflows, scenario's, incidenten, recoveries, development runs en productieverificaties.

De aanleiding is een bewezen structurele gap: meerdere losse policies konden ieder hun eigen subset correct afdwingen, terwijl een run toch kon eindigen voordat álle relevante context, acties, root cause, fixes, tests, productie-evidence, documentatie, learning en obligations in dezelfde canonical closed loop waren vastgelegd.

## Hoofdregel
Geen terminale status zonder een geldig `POWERHOUSE-UNIVERSAL-COMPLETION-MANIFEST-v1`.

Iedere verplichte categorie moet expliciet één van twee toestanden hebben:
- `COMPLETE`: met minimaal één evidence-object met `source` en `observedAt`;
- `NOT_APPLICABLE`: met een concrete reden waarom de categorie voor deze run niet van toepassing is.

Ontbreken is nooit impliciet `NOT_APPLICABLE`; ontbreken is failure.

## Verplichte categorieën
Iedere materiële run verantwoordt minimaal:
1. goal/context;
2. acties;
3. gewijzigde componenten;
4. beslissingen;
5. fouten/incidents;
6. root cause;
7. fixes;
8. tests/gates;
9. production readback;
10. outcome/value;
11. open obligations;
12. regression/prevention;
13. documentatie;
14. learning writeback;
15. architecture/ADR/System Map;
16. ownership/successor;
17. security/privacy/secrets;
18. cost/performance;
19. runtime identity;
20. interruption recovery;
21. evidence lineage.

## LIVE & BEWEZEN
`LIVE & BEWEZEN` mag alleen wanneer:
- alle verplichte categorieën accounted zijn;
- alle niet-N/A categorieën bewijs hebben;
- er geen niet-terminale open obligations bestaan;
- canonical writeback-referenties aanwezig zijn;
- production readback exact aan dezelfde candidate identity is gebonden;
- iedere materiële change/error/root cause/fix/prevention/architectuur/cost learning ook als canonical learning is persisted.

Groene CI, merge naar `main`, provider `sent`, lokale tests of een menselijke samenvatting vervangen geen van deze voorwaarden.

## BLOCKED_HARD_BOUNDARY
Een harde grens is alleen terminaliseerbaar wanneer dezelfde volledige categorie-accounting bestaat en daarnaast:
- de blocker concreet is;
- actuele evidence de grens bewijst;
- een concreet recovery path bestaat.

Een technisch oplosbare open actie is nooit een hard boundary.

## Integratie
Canonieke componenten:
- semantic authority: `brain/policies/chat-to-brain-completeness-v1.json`;
- enforcement policy: `config/powerhouse-universal-completion-v1.json`;
- validator: `scripts/brain/powerhouse-universal-completion-gate.mjs`;
- mandatory preflight: `scripts/brain/chat-learning-preflight.mjs`;
- regressietests: `tests/brain-universal-completion-gate.test.mjs` en `tests/brain-universal-completion-integration.test.mjs`;
- learning: `brain/learning/universal-completion-gap-2026-09-17.json`.

De preflight exposeert de universal-completion policy vóór materiële uitvoering. De postflight-validator is verplicht vóór iedere terminale claim.

## Preventieregel
Alles wordt expliciet verantwoord. Geen silent omission, geen chat-only learning, geen docs-only completion, geen green-CI-as-production-proof, geen production-green-zonder-writeback, geen open obligation onder `LIVE & BEWEZEN`, geen stale/cross-candidate evidence en geen parallelle truth store.

## Definition of Done
Een Powerhouse-run is pas compleet wanneer de validator groen is én de canonical writeback/readback zelf teruggelezen kan worden door een volgende agent via dezelfde preflight. Daardoor is borging geen vervolgstap meer, maar onderdeel van de terminale state machine zelf.
