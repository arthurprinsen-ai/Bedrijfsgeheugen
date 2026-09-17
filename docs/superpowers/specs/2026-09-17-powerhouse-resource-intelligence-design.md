# Powerhouse Resource Intelligence — ontwerp

Datum: 2026-09-17
Status: approved architecture / implementation authority

## Doel

Maak kosten, gebruik, energie, CO2e, water, AI-verbruik, mensinspanning, security/compliance en gerealiseerde waarde één canonieke beslislaag voor Powerhouse, alle agents/chats en het tenant-scoped klantportaal. De capability gebruikt bestaande Powerhouse-authorities en creëert geen parallel learning-, cost- of compliancebrein.

## Hoofdcontract

`source -> usage -> cost -> resources -> impact -> value -> compliance -> recommendation -> action -> outcome -> learning`

Elke materiële Powerhouse-operatie moet, waar technisch meetbaar, resource-impact meenemen. Ontbrekende providertelemetrie blijft `UNKNOWN`; schattingen worden nooit als gemeten feit gepresenteerd.

## Bestaande authority die wordt hergebruikt

- `brain_operations`: operation/idempotency authority.
- `brain_budget_usage`: append-only resource/cost facts.
- `powerhouse_resource_factors`: versioned conversion factors voor energie/CO2e/water.
- `powerhouse_action_economics`: geobserveerde provider/externe kosten en human minutes.
- `powerhouse_realized_values`: gerealiseerde waarde.
- `brain_ai_governance_registry`: AI-system/use-case register.
- `powerhouse_evidence_sources` + observations: evidence/freshness.
- `brain_obligations`: alle gaps en herstel-/optimalisatieverplichtingen.
- `brain_records`: current state, decisions en learnings.
- bestaande `powerhouse_autonomous_improvement_*` loop: autonome evidence-driven verbetering.

## Normalisatie en provenance

Providerdata wordt als één of meer `brain_budget_usage` facts geregistreerd. Verplichte metadata voor nieuwe adapters:

- `tenant_id`
- `measurement_class`: `MEASURED`, `PROVIDER_REPORTED`, `CALCULATED`, `MODELLED`, `ESTIMATED`, `UNKNOWN`
- provider/service/model/resource identifiers waar beschikbaar
- source evidence/reference
- region/geography waar relevant
- attribution keys naar action/outcome/campaign/process waar beschikbaar

`powerhouse_resource_factors` bevat alleen expliciet geversioneerde factoren met bron, methodologie, geldigheidsperiode en confidence. Geen factor = geen geschatte impact.

## Resource Intelligence projection

Een canonical view verrijkt usage facts met passende factoren en berekent uitsluitend afgeleide energie/CO2e/water wanneer een geldige factor bestaat. Een tenant-scoped snapshot-RPC levert:

- usage volume per provider/resource/unit;
- gemeten/geschat/unknown coverage;
- energy, CO2e, water waar verantwoord berekenbaar;
- AI use-case/governance coverage;
- evidence freshness;
- cost/value/economics context;
- open optimalisatie/compliance obligations;
- expliciete data-quality/provenance flags.

## Autonome optimizer

Dagelijkse Resource Intelligence optimizer draait idempotent op Amsterdam-datum en gebruikt dezelfde closed loop als Powerhouse:

`OBSERVE -> DETECT -> PROPOSE -> GUARD -> APPLY/OBLIGATE -> VERIFY -> VALUE -> LEARN -> WRITEBACK`

Autonomiebeleid:

- `AUTO_ALLOWED`: alleen reversibel, low-risk, geen externe communicatie, geen destructive schema/data, geen secrets/privilege change, geen juridische claim, geen materiële spend en vooraf toegestane policy.
- `GOVERNED_OBLIGATION`: alle overige changes worden als evidence-backed `brain_obligations` vastgelegd.
- geen optimalisatie mag security, correctness, tenant isolation, evidence quality, compliance of reliability verslechteren.
- kostenbesparing zonder aantoonbare kwaliteitspariteit is geen geldige promotie.

De eerste productieversie automatiseert detectie, prioritering, obligations, current-state/readback en learning. Provider-side wijzigingen worden pas automatisch uitgevoerd wanneer een expliciete veilige adapter + policy bestaat.

## Compliance evidence model

Eén versioned framework/control registry ondersteunt minimaal:

- EU AI Act (o.a. Article 50 transparency; applicability per rol/use case)
- NIS2 (risk management + incident reporting evidence)
- CSRD/ESRS readiness (applicability/materiality/evidence, geen juridisch 'compliant'-vinkje)

Elk control-resultaat bevat applicability, evidence, freshness en status (`EVIDENCED`, `PARTIAL`, `OPEN`, `NOT_APPLICABLE`, `UNKNOWN`). Frameworkbron en verificatiedatum zijn zichtbaar. Agents mogen geen juridische conclusie verzinnen.

## Connectorcontract

Elke bestaande/nieuwe connector moet naast businessdata zo veel mogelijk telemetry leveren: usage, cost, tokens, requests, compute, storage, bandwidth, latency, retries, failures, provider-reported sustainability en licentie/plan data. Niet-beschikbare velden blijven unknown.

## Portal

Portal V2 krijgt één `Resource Intelligence` / Impact & Governance view vanuit dezelfde tenant-scoped read model. Hoofd-KPI's: Cost, Value, AI, Energy, CO2e, Water, Efficiency, Security/Compliance. Iedere waarde toont provenance/confidence/freshness en drill-down naar provider/service/agent/model/operation.

## Security en privacy

- RLS/server-only authority voor ruwe resource facts en factors.
- tenant-scoped snapshot; nooit cross-tenant aggregatie naar klant.
- secrets nooit in telemetry/metadata.
- append-only/correction semantics blijven gelden.
- estimated sustainability metrics worden duidelijk gelabeld.

## Definition of Done

1. migration + regression contract in repo;
2. production migration toegepast;
3. security/performance advisors gecontroleerd;
4. snapshot/readback bewijst schema/functions/cron;
5. autonomous daily run produceert idempotente state + obligations;
6. agent contract bevat Resource Intelligence hard gate;
7. portal navigation/read-model kan resource snapshot tonen zonder voorbeeldcijfers;
8. CI required check groen en exact-head merge;
9. Netlify production deploy exact SHA + production readback groen;
10. learning/writeback met evidence en resterende provider-coverage obligations.