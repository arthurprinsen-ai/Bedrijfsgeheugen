# Powerhouse Green Assurance — borging 2026-09-29

## Aanleiding

Een Powerhouse-systeem kan technisch volledig bedraad zijn en toch operationeel niet groen. Tijdens de assurance-run waren alle 32 intelligence-lagen gekoppeld en alle 18 required jobs actief, terwijl evidence-, content- en lineage-statussen nog open stonden.

## Permanente borging

De canonieke status is voortaan evidence-first en fail-closed. Groen betekent niet “workflow draaide”, maar dat het beoogde resultaat actueel is teruggelezen via de juiste authority.

De standaard assurance-keten is:

`signal -> decision -> action -> evidence -> outcome -> measurement -> learning -> guard`

### Regels

- Fresh required evidence is verplicht; stale of missing blijft non-green.
- Provider-neutral capabilities mogen niet door één optionele leverancier worden gegijzeld.
- Retired tooling, waaronder Buffer in de huidige publicatiearchitectuur, is telemetry-only en geen kritieke green gate.
- Provider-ACK bewijst een side effect, niet automatisch een business outcome.
- Reeds gepubliceerde social content met `republish_forbidden` wordt nooit opnieuw gepubliceerd om een readbackprobleem te maskeren.
- Instagram is Mira-only en vereist exact media + visuele identiteit + temporele continuïteit.
- Structurele forecast/action/outcome-lineage wordt in de bestaande canonical stores hersteld.
- Iedere assurance-fix krijgt Brain learning, skill/agent projection, ledger/docs en System Map writeback.

## Human operating rule

Chats en agents mogen geen dashboardstatus cosmetisch promoveren. Zij herstellen eerst de oorzaak en laten de centrale health opnieuw rekenen. Alleen actuele externe/read-after-write evidence kan GREEN of LIVE_BEWEZEN opleveren.

## Canonieke onderdelen

- `.agents/skills/powerhouse-green-assurance/SKILL.md`
- `brain/learning/2026-09-29-powerhouse-green-assurance-v1.json`
- `brain/policies/powerhouse-agent-continuity-v1.json`
- `config/powerhouse-truth-status-contract.json`
- `platform/system-map/canonical-system-map.mjs`
- `docs/development-ledger-events/2026-09-29-powerhouse-green-assurance-v1.md`

## Truth boundary

Deze documentatie borgt het contract. Zij is geen bewijs dat alle runtime-statussen op ieder toekomstig moment groen zijn; daarvoor blijft actuele runtime/provider readback vereist.
