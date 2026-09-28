# Company Intelligence OS — contextuele Portal V2-visualisatie v1

## Doel

De Company Intelligence OS wordt niet als los AI-dashboard toegevoegd. Dezelfde intelligentie wordt zichtbaar op de bestaande plekken waar directie en teams beslissen en uitvoeren.

## Contextuele surfaces

- Executive cockpit: **Powerhouse ziet nu** met signaal → context → besluit → actie → learning.
- Company cockpit: dezelfde context boven de operationele prioriteiten.
- € Impact Engine: relevante intelligence context naast waarde/impact.
- Next Best Actions: zichtbaar waarom een actie nu relevant is.
- Monitoring & Learning: Outcome Memory en learning in dezelfde beslisketen.
- Evidence Health: herkomst en bewijs blijven zichtbaar.
- Roadmap: Powerhouse-afgeleide kaarten tonen impact/effort/context in plaats van alleen planning.

## Visueel contract

De herbruikbare renderer toont vijf begrijpelijke stappen: **Ziet → Begrijpt → Beslist → Doet → Leert**. Een compacte Company Graph-preview verbindt alleen tenant-scoped nodes die al in de portalcontext bestaan. Outcome Memory toont verwacht en gerealiseerd afzonderlijk.

## Security/truth boundary

De globale Company Intelligence runtime-views worden niet rechtstreeks in klant-UI gelezen zolang tenantisolatie daar niet expliciet bewezen is. De klantvisualisatie gebruikt uitsluitend de bestaande beveiligde tenant-state/runtime. Ontbreekt bewijs, dan toont de UI bewust geen verzonnen context.

## Tenant-isolatie evaluatie

De contextuele portalprojectie heeft expliciete shadow- en canary-regressie voor tenantisolatie. De evaluatie projecteert twee gescheiden klantcontexten en faalt wanneer labels, bronnen, acties, learnings of waarden tussen die contexten lekken. De canary controleert daarnaast dat verwachte en gerealiseerde waarde semantisch gescheiden blijven.

## Aanvullende contextbinding

- Roadmap leest dezelfde tenant-scoped `portal.runtime` als de overige portaloppervlakken en toont Powerhouse-afgeleide impact/effort-tags alleen wanneer die waarden werkelijk aanwezig zijn.
- Capability Graph krijgt dezelfde Company Intelligence-context erboven, zodat graph-relaties niet losstaan van besluit, actie, outcome en learning.
- De visualisatie blijft fail-closed: geen tenant-runtime betekent geen synthetische Company Intelligence-context.
