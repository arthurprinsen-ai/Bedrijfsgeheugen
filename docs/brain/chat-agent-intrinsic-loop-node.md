# Chat en Agent als intrinsieke Powerhouse-loop-node

## Doel

Deze borging maakt expliciet dat een chat of agent geen los hulpmiddel buiten Bedrijfsgeheugen/Powerhouse is. Iedere materiële chat en agent is een uitvoeringsnode binnen dezelfde canonieke control- en learning-loop.

De machineleesbare authority staat in `brain/policies/powerhouse-agent-continuity-v1.json`, versie `POWERHOUSE-AGENT-CONTINUITY-v1.3`. De structurele regression staat in `tests/brain-powerhouse-universal-agent-learning-writeback.test.mjs`.

## Aanleiding

De continuity-policy verplichtte al current-state-first, reuse-first, delta-only en resumable execution. Wat nog ontbrak was een expliciet technisch contract dat voor zowel `chat` als `agent` vastlegt dat zij:

- intrinsieke execution nodes zijn;
- vóór materiële uitvoering canonieke Powerhouse-state moeten ophalen;
- geen lokale of parallelle waarheid mogen vormen;
- vóór terminale afronding hun geverifieerde state, evidence, outcome, learning, preventie en open obligations canoniek moeten terugschrijven;
- de volgende run laten hervatten vanaf die bijgewerkte canonieke state.

Zonder deze expliciete laag bleef het risico bestaan dat de regel alleen als intentie/documentatie bestond.

## Canonieke loop

Iedere materiële chat/agent-run volgt deze volgorde:

1. intent of obligation;
2. existing-state preflight;
3. relevante kennis en lineage ophalen;
4. bounded execution;
5. tests en gates;
6. merge/deploy/promote waar van toepassing;
7. productie/provider-readback en evidence;
8. outcome en business value;
9. root-cause learning en preventie;
10. canonical writeback;
11. volgende run vanaf de bijgewerkte canonieke state.

Daarmee is een chat-einde, model-stop, tool-stop of agent-einde op zichzelf nooit functionele completion.

## Verboden patronen

De continuity-authority blokkeert conceptueel en via regression de volgende patronen:

- isolated chat memory als authority;
- een parallel agent brain als authority;
- alternative truth buiten Powerhouse;
- opnieuw vanaf nul beginnen terwijl relevante canonieke state bestaat;
- terminal success zonder outcome, learning en writeback.

## Delivery en bewijs

De wijziging is geleverd via PR #1989 op exact candidate head:

`30aef234de47d0d6fef208745df2e9e9a60a8c58`

Daarop waren de relevante gates groen:

- Required test;
- BRAIN delivery;
- Powerhouse CodeQL.

Daarna is exact-head protected gemerged. De bewezen main-SHA is:

`cbaf6c123c697cacc769fa76ba2303af5e58fd51`

Main-readback bevestigde zowel policy v1.3 als de regression in de verplichte backend-contractsuite.

## Learning 1 — admission metadata is onderdeel van execution

De eerste Required-run faalde vóór dure CI in de bestaande hygiene/admission gate. De oorzaak was niet functioneel: de PR miste de verplichte canonieke delivery-metadata.

De fix was om op dezelfde PR-lineage expliciet vast te leggen:

- `Obligation-ID`;
- `Delivery-Lane`;
- `Candidate-Type`;
- `Base-SHA`;
- `Supersedes`.

Preventieregel: een executable candidate is pas een geldige Powerhouse-candidate als ook zijn delivery-identiteit machineleesbaar is. Admission niet omzeilen of versoepelen; de metadata of exacte root cause herstellen.

## Learning 2 — een test die CI niet uitvoert is geen borging

Aanvankelijk bestond een losse nieuwe regression-test. Inspectie van de backend-lane liet zien dat die test niet in de verplichte testset zou draaien.

De regression is daarom verplaatst naar de al verplichte `tests/brain-powerhouse-universal-agent-learning-writeback.test.mjs` en de losse test is verwijderd.

Preventieregel: alleen het bestaan van een testbestand is onvoldoende. Bescherming telt pas als een required/governed CI-lane de regression daadwerkelijk uitvoert. Hergebruik een bestaande testfamilie en control-plane waar mogelijk; bouw geen parallelle CI-waarheid.

## Relatie met execution resilience

Deze borging vult `powerhouse-execution-resilience-v1` aan. Execution resilience zorgt dat een onderbroken run kan hervatten vanaf durable state; het loop-node contract zorgt dat chats en agents überhaupt verplicht onderdeel zijn van diezelfde durable state-, evidence-, obligation- en learning-loop.

Samen betekent dit:

- de tijdelijke chat/model/worker-lifetime is nooit de proces-authority;
- canonical Powerhouse state is de proces-authority;
- onderbreking is recovery, geen completion;
- volgende nodes erven de laatst bewezen state;
- learning en prevention worden cumulatief.

## Definition of Done

Deze borging blijft alleen groen zolang:

- continuity v1.3 actief blijft;
- `chat` en `agent` beide onder `loop_node_contract` vallen;
- één canonical Powerhouse loop verplicht blijft;
- canonical state vóór uitvoering verplicht blijft;
- canonical writeback vóór terminale afronding verplicht blijft;
- de volgende run moet hervatten vanaf geschreven state;
- de regression in de required backend-suite blijft draaien;
- een chat/agent geen alternatieve authority naast Powerhouse kan worden.

## Canonieke learning

De machineleesbare learning voor incident, oorzaak, fix, evidence en prevention staat in:

`brain/learning/chat-agent-intrinsic-loop-node-2026-09-18.json`

## Skill-laag

De continuity-regel is daarnaast vindbaar gemaakt als cross-runtime agentskill:

`.agents/skills/powerhouse-continuity/SKILL.md`

De skill is bewust geen nieuwe authority. Hij verwijst terug naar de canonieke continuity-policy, learning, documentatie en required regression. `AGENTS.md` laadt hem direct na het agentcontract in de verplichte leesvolgorde. De required regression blokkeert verwijdering of ontkoppeling van deze skill.

Preventieregel: skills zijn discovery/execution guidance bovenop canonieke Powerhouse-state; zij mogen nooit een parallelle waarheid, eigen status of afwijkend completion-contract introduceren.
