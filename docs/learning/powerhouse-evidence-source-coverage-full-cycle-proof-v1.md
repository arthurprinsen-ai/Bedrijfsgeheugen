# Powerhouse Evidence Source Coverage & Full-Cycle Proof v1

**Contract-ID:** `powerhouse-evidence-source-coverage-full-cycle-proof-v1`  
**Authority:** Bedrijfsgeheugen Powerhouse / Growth & Revenue Operating System  
**Effective:** 2026-09-15

## Doel
Deze uitbreiding sluit de resterende observability-gap rond echte marktdata. De bestaande Evidence Collector & Experiment Orchestrator blijft authority voor assignments, economics, feedback, outcomes, calibration en policy promotion. Deze laag voegt broncoverage, provider-readback, statistische onzekerheid en een expliciete full-cycle proof-view toe zonder parallel CRM, learning store of analytics brain.

## Nieuwe authorities
- `powerhouse_evidence_sources`: registry van relevante evidencebronnen, writer-contracten, owner en freshness-eis.
- `powerhouse_evidence_source_observations`: dedupebare readback/provenance per bron.
- `powerhouse_evidence_source_coverage_v1`: fresh/stale/missing per bron en of dat full-cycle proof blokkeert.
- `powerhouse_full_cycle_evidence_v2`: per echte sales action bewijs van assignment, economics, human feedback, reply, meeting, proposal, win/loss en realized revenue.
- `powerhouse_experiment_effect_uncertainty_v1`: standaardfout, 95%-interval en geobserveerde approximate MDE voor treatment-vs-holdout outcome-rate.
- `powerhouse_evidence_operating_health_v3`: centrale readback voor ontbrekende/stale required sources en lineage-gaten.

## Broncontracten
### Continu required
- Gmail: verbonden provider-readback en deterministisch gekoppelde replies.
- Calendly: verbonden provider-readback en meeting-events.
- LinkedIn: echte provider/extension engagement-ingest; stilstand blijft zichtbaar en wordt niet groen gemaakt met synthetische events.
- Offers: canonieke `offertes`-flow en status/acceptance readback.
- Finance revenue: gerealiseerde omzet uit een harde financiële bron. Zolang die bron niet gekoppeld is blijft full-cycle bewijs terecht geblokkeerd.

### Event-driven intern
De volgende bronnen hoeven niet periodiek records te produceren. Afwezigheid is legitiem zolang de corresponderende actie/event niet plaatsvindt; volledigheid wordt per actie/experiment gecontroleerd:
- `action_economics`
- `human_feedback`
- `market_outcomes`
- `experiment_assignment`

## Automatische instrumentatie
Database-triggers schrijven source observations voor economics, human feedback, market outcomes, prospective assignments, LinkedIn engagement en offertewijzigingen. `bg_calendly_uitkomst` schrijft daarnaast Calendly source evidence naast de bestaande appointment outcome-route.

Gmail en Calendly hebben bovendien een geactiveerde ChatGPT-taak `Powerhouse Evidence Sync`, ieder uur op minuut 23 Europe/Amsterdam. Deze taak leest alleen nieuwe provider-events, schrijft minimale provider-ID/timestamp/provenance naar de bestaande Powerhouse-ingress en schrijft commerciële outcomes uitsluitend bij deterministische action/opportunity-linkage. Ongekoppelde events blijven ongeattribueerd; er wordt niets geraden.

## Privacy/minimisatie
Connector health/readback slaat geen mailbody of andere private inhoud op. Voor Gmail is bij de eerste readback alleen providerbereik, queryscope, count en provider-ID vastgelegd. Calendly-readback slaat connectorbereik en eventcount op. Downstream outcome-ingest gebruikt alleen wat nodig is voor lineage/provenance.

## Legacy cutover
Het evidence-orchestrator contract werd productieactief op 2026-09-15 19:21:18 UTC. Vier al eerder uitgevoerde sales actions zonder prospective assignment blijven als `legacy_pre_contract_unassigned` zichtbaar. Ze blokkeren nieuwe causal proof niet en worden nooit retrospectief in een experiment gestopt.

Dit is essentieel: historische acties zijn observaties, geen causale experiment-evidence.

## Statistische onzekerheid
`powerhouse_experiment_effect_uncertainty_v1` berekent voor de outcome-rate difference:
- standaardfout;
- 95% confidence interval;
- approximate observed MDE op 95%-niveau;
- boolean `outcome_rate_uplift_statistically_clear_95`.

Dit vervangt de bestaande revenue/calibration promotion-gates niet maar voegt onzekerheidsinformatie toe. Geen policy mag enkel op volume of ruwe uplift als bewezen worden gepromoveerd.

## Eerste productie-readback
Na live activering en externe connector-readback:
- post-contract executed actions missing assignment: **0**;
- executed actions missing economics: **0**;
- wins without realized revenue: **0**;
- legacy pre-contract unassigned: **4**;
- promoted NBA policies: **0**;
- Gmail connector: fresh readback;
- Calendly connector: fresh readback, 0 events in gecontroleerd venster;
- Offers: canonical table/trigger readback actief;
- required source blockers: **2**;
  - `finance_revenue`: nog geen harde financiële feed;
  - `linkedin`: geen verse provider/extension-ingest sinds de nieuwe coverage-registry; laatste bestaande echte engagement-event dateert van 2026-09-12.
- health state: `source_coverage_incomplete`.

## Harde truth boundary
De infrastructuur mag groen zijn terwijl de volledige commerciële machine nog niet end-to-end bewezen is. Volledige status wordt pas `LIVE & BEWEZEN` wanneer:
1. alle required source routes fresh zijn;
2. een echte post-contract prospect prospective assignment heeft;
3. treatment/holdout correct wordt uitgevoerd;
4. echte economics/human feedback worden vastgelegd waar van toepassing;
5. downstream reply/no-response → meeting → proposal → win/loss → realized revenue volledig gelinkt is;
6. de horizon matured is;
7. treatment-vs-holdout effect + uncertainty meetbaar is;
8. alleen bij groene bestaande calibration gates een policy wordt promoted;
9. die promoted policy via `powerhouse_next_action_policy_authority_v1` aantoonbaar een volgende beslissing beïnvloedt;
10. de nieuwe beslissing opnieuw markt-evidence oplevert.

Geen synthetische backfill, geen retrospectieve assignment, geen fake revenue en geen confidence op basis van aantallen alleen.
