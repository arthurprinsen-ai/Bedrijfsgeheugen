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

## Productiebevestiging

Status: **LIVE_PROVEN**.

Netlify provider-readback bevestigt productie-deploy `6abac41210b244000884a323` met `state=ready`, `context=production` en exact `commit_ref=0b4547f33a74ce911a0d324a53404cff1cc6e737`. Dat is de protected feature merge die de contextuele Company Intelligence renderer, styling en koppelingen naar executive cockpit, company cockpit, impact, next-best-actions, monitoring/learning, evidence health en roadmap bevat.

De aanvullende tenant-isolatie-evaluatie is protected merged als `764a7387e1852e7c1e8700efc443d29870221f39`; historical replay, shadow en canary zijn groen. Daarmee is de klantprojectie zowel functioneel als tenant-isolatie-technisch geborgd.

## Aanvullende contextbinding

- Roadmap leest dezelfde beveiligde tenant-scoped `portal.runtime` als de overige portaloppervlakken.
- Powerhouse-afgeleide roadmapkaarten tonen beschikbare impact- en effortcontext; ontbrekende waarden blijven bewust afwezig.
- Capability Graph toont dezelfde Company Intelligence-context zodat relaties direct verbonden blijven met besluit, actie, outcome en learning.

## Permanente governance

Deze contextuele projectie is voortaan onderdeel van het vaste Company Intelligence OS-contract.

Voor toekomstige uitbreidingen geldt:
- nieuwe intelligentie wordt waar relevant ingebed in bestaande besluit- en uitvoeringsschermen;
- een nieuw los dashboard is alleen toegestaan als een bestaande contextuele surface aantoonbaar niet volstaat;
- klantweergave gebruikt uitsluitend geauthenticeerde tenant-scoped runtime;
- ontbrekende tenant-evidence blijft leeg/onbekend en wordt nooit aangevuld met globale of voorbeelddata;
- verwacht/forecast blijft altijd gescheiden van gerealiseerd/observed;
- Outcome Memory verschijnt alleen bij aantoonbare actie→uitkomst-lineage;
- dezelfde intelligence lineage wordt hergebruikt op cockpit, impact, beslissingen, graph, roadmap, monitoring/learning en evidence;
- iedere materiële wijziging sluit af met tests, tenant-isolatie-evaluatie, skill, learning, System Map, change-doc en development ledger.
