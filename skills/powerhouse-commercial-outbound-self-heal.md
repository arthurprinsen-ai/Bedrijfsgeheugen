# Powerhouse Commercial Outbound Self-Heal

Fingerprint: `commercial|outbound-transport-self-heal|gmail-linkedin-dm|v1`.

Deze skill geldt voor iedere chat/agent/workflow die commerciële e-mail, LinkedIn-DM, relatie-outreach, Growth & Revenue OS of provider-delivery raakt.

## Doel
Een herstelbare transport- of connectorfout mag nooit een verschuldigde commerciële actie stil laten eindigen als `error`. Dezelfde canonieke sales-action lineage blijft eigenaar tot provider-readback of een echte harde grens.

## Verplichte preflight
Voor iedere outbound provider-write:
1. lees de canonieke `powerhouse_sales_actions` action, suppression, cooldown, dedupe, relatie-/consentstatus en daglimiet;
2. verifieer provider-project-consistentie: de configured connection moet bestaan en ACTIVE zijn binnen hetzelfde provider/API-project als de credential die de runtime gebruikt;
3. onderscheid Composio MCP/ChatGPT word-id/alias van raw Composio API connected-account nanoid; deze IDs zijn niet uitwisselbaar;
4. bij direct Composio execute: gebruik de actuele toolcontractversie/default pin, nooit literal `version: "latest"`; geef zowel `connected_account_id` als vereiste top-level `user_id`/entity identity mee;
5. serialiseer providerfouten als volledig JSON-object. `[object Object]` is een escaped defect en mag niet opnieuw voorkomen.

## Self-heal
Bij 4xx/5xx, connection mismatch, stale token of ontbrekende provider capability:
- diagnoseer root cause in dezelfde run;
- verifieer vóór retry of er extern al een side-effect bestaat;
- republish/re-send is verboden zodra provider message/thread/post evidence bestaat;
- als server-side Composio Gmail ontbreekt maar de canonieke actieve Gmail connector beschikbaar is, gebruik die als gecontroleerde fallback binnen dezelfde sales-action lineage;
- schrijf echte provider message/thread IDs terug naar `powerhouse_sales_actions` en `powerhouse_sales_outcomes`;
- respecteer altijd max_daily_sends, suppression, cooldown, existing-relationship/consent, dedupe en opt-out;
- overschrijd de daglimiet niet om recovery te versnellen: defer deterministisch naar de volgende geldige run.

## LinkedIn-DM
LinkedIn-DM is fail-closed. Een normale LinkedIn posting connector is geen DM-capability.
- alleen verzenden via een aantoonbaar werkende send-DM provider/tool;
- nooit DM-success simuleren via posts/comments;
- ontbreekt een echte DM-route en bestaat binnen dezelfde geautoriseerde relatie een bekend e-mailadres, dan mag de canonical e-mailfallback worden gekozen volgens dezelfde commerciële guards;
- anders blijft de DM-action een capability-boundary, niet een gefingeerde delivery.

## Evidence en learning
Closure vereist:
`action → provider ack → provider readback → outcome → reply/next action → learning → prevention`.

Iedere nieuwe transportfout schrijft root cause, bewezen fix en preventieregel naar `brain_failure_registry`, Brain learning en Loop Assurance. De volgende agent moet dit via preflight kunnen ontdekken.

Referentie-incident 2026-09-30:
- root cause: Gmail connected-account word-id kwam uit een andere Composio omgeving dan de server-side API-key;
- direct execute vereiste bovendien top-level user/entity identity;
- oude foutlogger verloor providerdetails als `[object Object]`;
- recovery: 5 mails provider-bevestigd via canonieke Gmail fallback en met echte Gmail message/thread IDs teruggeschreven; 6e action deferred door daily cap=5.
