# Powerhouse Evidence Coverage & Full-Cycle Proof v1

**Contract-ID:** `powerhouse-evidence-coverage-full-cycle-proof-v1`  
**Authority:** Bedrijfsgeheugen Powerhouse / Growth & Revenue Operating System  
**Status:** production-enforced  
**Effective:** 2026-09-15

## Doel
Deze laag bewijst niet alleen dat experiment/evidence-tabellen bestaan, maar dat de echte commerciële bronnen en executors aantoonbaar op dezelfde Powerhouse-leerlus zijn aangesloten. De laag bouwt geen parallel systeem. Zij gebruikt de bestaande canonical assignments, sales actions, action economics, human feedback, market outcomes, policy authority en provider/bron-ingests.

## Contract
De volledige commerciële leerlus mag pas als end-to-end productiebewezen gelden wanneer:
1. verplichte provider-/broncoverage vers is;
2. uitgevoerde post-contract actions prospectief toegewezen zijn wanneer experimentgedreven;
3. treatment-actions echte economics hebben;
4. replies/meetings/proposals/wins/losses/revenue via canonieke outcome-lineage terugkomen;
5. gerealiseerde omzet uit een harde financiële bron komt;
6. geen policy-promotie buiten de bestaande calibration/actionability-gates plaatsvindt;
7. legacy pre-contract actions niet retrospectief aan experimenten worden toegewezen.

## Canonieke componenten
- `powerhouse_evidence_sources`: registry van bronklasse, requirement, freshness-SLO, writer contract en owner.
- `powerhouse_evidence_source_observations`: dedupe/provenance readbacks van echte bron- of connectorobservaties.
- `powerhouse_record_evidence_source_observation_v1`: server-only write contract voor bronreadback.
- `powerhouse_evidence_source_coverage_v1`: fresh/stale/missing + full-cycle blocker per bron.
- `powerhouse_full_cycle_evidence_v2`: action-level proof van assignment, economics, human feedback, downstream outcomes en realized revenue.
- `powerhouse_evidence_operating_health_v3`: samengevoegde operationele waarheid.
- `powerhouse_next_action_policy_authority_v1`: blijft de enige policy authority voor NBA.
- `powerhouse_experiment_effect_uncertainty_v1`: uncertainty-projectie bovenop de bestaande experiment-effect authority.

## Required versus event-driven
Periodieke connector/provider-bronnen zijn required en mogen stale/missing full-cycle proof blokkeren:
- Gmail
- Calendly
- LinkedIn
- offers/proposal flow
- finance/revenue

Event-driven interne evidence is conditioneel verplicht en krijgt daarom geen kunstmatige heartbeat-eis:
- experiment assignment
- action economics
- human feedback
- market outcomes

Zo wordt geen menselijke edit vereist wanneer niemand iets edit, en geen experiment-assignment vereist wanneer er geen experiment draait. Wanneer zo'n event wél hoort te bestaan, bewaakt `powerhouse_full_cycle_evidence_v2` de lineage.

## Legacy-cutover
Het evidence-first experimentcontract werd productie-actief op **2026-09-15 19:21:18 UTC**. Uitgevoerde acties van vóór dit tijdstip zonder assignment worden aangeduid als `legacy_pre_contract_unassigned`. Ze tellen als historische observatie, maar blokkeren de nieuwe causaliteitsketen niet. Ze worden nadrukkelijk niet retrospectief toegewezen, omdat dat causale bewijs zou vervalsen.

Post-contract acties kunnen onder andere deze proof states krijgen:
- `missing_assignment`
- `missing_economics`
- `awaiting_mature_outcome`
- `win_without_realized_revenue`
- `matured_market_evidence`

## Automatische connectorreadback
Een ChatGPT scheduled task `Powerhouse Evidence Sync` leest elk uur verbonden Gmail- en Calendly-bronnen en schrijft alleen truthful metadata/provenance terug via de bestaande Powerhouse evidence-ingress. De taak:
- verwerkt alleen nieuwe provider-events sinds de vorige run;
- dedupliceert op provider-ID;
- maakt geen synthetische replies/meetings/wins/revenue;
- schrijft alleen commerciële outcomes wanneer een deterministische action/opportunity-link bestaat;
- leest daarna `powerhouse_evidence_operating_health_v3` terug;
- verhoogt nooit zelfstandig policy-confidence.

## Automatische runtime-instrumentatie
Migration `20260915195130_powerhouse_evidence_coverage_runtime_delta_v1` borgt de live write-paths bovenop de canonieke reconciliation:
- economics-writes maken automatisch een source observation;
- human feedback-writes maken automatisch een source observation;
- market outcomes maken automatisch een source observation;
- prospective assignments maken automatisch een source observation;
- nieuwe LinkedIn engagement-events maken automatisch een source observation;
- offerte-status/bedrag/akkoord-wijzigingen maken automatisch een source observation;
- `bg_calendly_uitkomst` behoudt de bestaande appointment-route én schrijft Calendly provenance naar dezelfde evidence registry.

Alle runtime-writers zijn fail-closed: SECURITY DEFINER heeft een deterministische search path, browserrollen hebben geen EXECUTE en `service_role` is de uitvoeringsauthority. De interne uncertainty-view gebruikt `security_invoker=true` en is alleen voor `service_role` leesbaar.

## Statistische onzekerheid
`powerhouse_experiment_effect_uncertainty_v1` voegt bovenop `powerhouse_experiment_effect_estimates_v1` toe:
- standaardfout van treatment-minus-holdout outcome-rate;
- 95%-confidence-interval onder de bestaande eenvoudige binomiale projectie;
- `observed_mde_approx_95` als benadering van de actuele detecteerbare effectmarge;
- `outcome_rate_uplift_statistically_clear_95`.

Deze projectie mag de bestaande causal-readiness, economics-, calibration- en policy-promotion-gates niet omzeilen. Een positief puntestimate of groot volume is op zichzelf geen bewezen learning.

## Evidence-integriteit
`powerhouse_evidence_source_observations.evidence` mag niet leeg zijn. De foreign key naar `powerhouse_evidence_sources` gebruikt `ON DELETE RESTRICT`, zodat historische bewijsrecords niet via het verwijderen van een registryregel kunnen verdwijnen. Observaties blijven daarmee auditbaar en niet cascade-verwijderbaar.

## Productiereadback 2026-09-15
Na connector-readback en reconciliation:
- Gmail: **fresh**
- Calendly: **fresh**
- offers: **fresh**
- action economics: event-driven/non-blocking
- market outcomes: event-driven/non-blocking
- experiment assignment: event-driven/non-blocking
- human feedback: event-driven/non-blocking
- LinkedIn: **missing, blocking** zolang geen nieuwe provider/extension-ingest is waargenomen
- finance/revenue: **missing, blocking** zolang geen harde gerealiseerde-omzetbron is gekoppeld
- post-contract executed actions missing assignment: **0**
- post-contract executed actions missing economics: **0**
- wins without realized revenue: **0**
- legacy pre-contract unassigned actions: **4**
- promoted NBA policies: **0**
- overall state: `source_coverage_incomplete`

## Waarom LinkedIn nog rood is
Er bestaat echte `linkedin_engagement_events`-data en `bg_linkedin_engagement_ingest`, maar een lokale database-read mag de providerbron niet kunstmatig fresh maken. De bron blijft fail-closed totdat de bestaande LinkedIn ingest/providerroute zelf actuele readback-observaties schrijft.

## Waarom finance/revenue nog rood is
Omzet mag niet worden afgeleid uit proposal amount, expected value of agenttekst. `finance_revenue` mag alleen fresh worden op basis van een harde financiële bron met provider-ID/timestamp/provenance en deterministische koppeling naar opportunity/order/customer. Tot zo'n bron gekoppeld is, blijft full-cycle revenue proof bewust geblokkeerd.

## Security en privacy
- Registry, observations, views en RPC zijn server-only.
- RLS staat aan op evidence-source stores.
- `public`, `anon` en `authenticated` hebben geen directe evidence-toegang.
- SECURITY DEFINER gebruikt een vaste, minimale search path.
- Connectorreadbacks bewaren voor health-doeleinden alleen noodzakelijke metadata/provenance; geen e-mailinhoud is nodig om een connectorheartbeat te bewijzen.

## Regressieregels
Defect wanneer een wijziging een van deze situaties mogelijk maakt:
- source health wordt groen zonder echte readback;
- een legacy actie krijgt achteraf een experimentele assignment;
- post-contract treatment kan uitgevoerd worden zonder assignment/economics;
- proposal value wordt als realized revenue behandeld;
- finance revenue wordt geaccepteerd zonder hard-source provenance;
- LinkedIn wordt fresh op basis van alleen een lokale tabelread;
- event-driven interne evidence wordt periodiek synthetisch gegenereerd;
- een niet-promoted policy verschijnt in de NBA authority;
- browserrollen krijgen toegang tot interne evidence registries/views;
- evidence-observaties kunnen leeg of door registry-cascade verwijderd worden;
- uncertainty wordt gebruikt als vervanging voor causal-readiness of calibration.

## Full-cycle definitie
Pas als de resterende harde bronnen groen zijn en een echte marktcyclus bestaat, mag de overkoepelende status naar volledig productiebewezen:
`prospective assignment → treatment/holdout → executed action → observed economics → human intervention (waar aanwezig) → reply/no-response → meeting → proposal → win/loss → hard-source realized revenue → effect estimate + uncertainty → calibration → policy promotion/demotion → next action`.
