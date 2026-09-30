# 2026-09-30 — Commercial outbound self-heal

## Incident
De autonome commerciële e-mailrun selecteerde zes geldige bestaande relaties, maar de transportlaag eindigde in HTTP 400. De oude adapter serialiseerde de providerdetails als `[object Object]`, waardoor de echte oorzaak niet zichtbaar bleef.

## Root cause
De configured Gmail connection was een Composio MCP/ChatGPT word-id uit een andere omgeving dan het server-side Composio API-project van `COMPOSIO_API_KEY`. Dat project bevatte geen Gmail-connection. Direct tool execution vereiste daarnaast top-level user/entity identity.

## Recovery
- provider-error logging gewijzigd naar volledige structured JSON;
- de mailrun is veilig hersteld via de actieve canonieke Gmail connector;
- 5 mails zijn provider-bevestigd met Gmail message/thread IDs en teruggeschreven naar dezelfde `powerhouse_sales_actions` lineage en `powerhouse_sales_outcomes`;
- action 6 is niet extra verstuurd: de harde daglimiet van 5 bleef intact en de action is doorgeschoven naar de volgende geldige run;
- `brain_failure_registry`, Brain learning en `autonomous-outreach` Loop Assurance bevatten de preventieregel;
- Growth & Revenue OS automation bevat dezelfde transport-self-heal policy;
- LinkedIn-DM blijft fail-closed zolang geen echte send-DM capability beschikbaar is.

## Permanente regel
Een herstelbare commerciële transportfout mag nooit stil als terminale `error` blijven staan. De owner diagnosticeert, verifieert externe side-effects, gebruikt alleen een veilige bestaande fallback, schrijft providerevidence terug en bewaart alle commerciële guards.

Skill: `skills/powerhouse-commercial-outbound-self-heal.md`.
Agent inheritance: `AGENTS.md`.
System Map: `COMMERCIAL_OUTBOUND_SELF_HEAL_V1`.
