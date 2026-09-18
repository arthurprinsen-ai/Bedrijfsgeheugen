# Delivery self-optimization — first-time-right terminal preflight

Datum: 2026-09-18  
Type: LEARNING / PREVENTION / OPTIMIZATION  
Fingerprint: `delivery|first-time-right|terminal-preflight|v1`

## Wat Powerhouse hiervan leert

Tijdens de borging van de merge-epoch guard ontstonden meerdere soorten frictie:

1. terminal writer metadata miste canonieke leasevelden;
2. `Candidate-Type` ontbrak en admission blokkeerde terecht;
3. actuele `main` bevatte een nieuw testbestand dat nergens door CI werd uitgevoerd;
4. BRAIN en CodeQL werden door GitHub geannuleerd zonder inhoudelijke failing assertion;
5. een regressietest verwachtte `optimization_fingerprint` terwijl de machine-readable skill dat veld nog niet bevatte;
6. moving-main en parallelle writers maakten eerder gelezen state snel stale.

Geen van deze gevallen rechtvaardigt blind nieuwe productcode of een nieuwe PR. Het juiste herstel is: actuele authority opnieuw lezen, de volgende waarschijnlijke invalidatie voorspellen, dezelfde lineage behouden en alleen de ontbrekende control-plane delta toevoegen.

## Nieuwe preventieregels

- valideer de volledige PR-delivery-envelope vóór dure CI;
- voeg workflow/classifier-dekking toe in dezelfde candidate als een nieuw testbestand;
- preflight machine schema en regression assertions samen;
- behandel `cancelled` zonder failing assertion als scheduler/concurrency recovery;
- gebruik dezelfde exact-head opnieuw waar mogelijk;
- refresh main/head/mergeability/gates vóór iedere irreversibele actie;
- re-plan zodra de delivery epoch verandert;
- beperk edits aan hot shared surfaces;
- maak geen duplicate lineage voor ordinary drift;
- preflight de volledige terminal path tot en met production readback en learning/skill writeback;
- meet delivery-frictie én forecastkwaliteit zodat Powerhouse leert welke candidate waarschijnlijk extra reconcile- of CI-kosten veroorzaakt.

## Te volgen signalen

`metadata_admission_reject_count`, `orphan_test_preflight_count`, `scheduler_cancel_retry_count`, `main_epoch_reconcile_count`, `shared_surface_overlap_count`, `green_gate_reuse_ratio`, `time_to_terminal_proof`, `stale_state_prevented_count`, `predicted_collision_avoided_count`, `pre_ci_contract_defect_count`, `duplicate_lineage_prevented_count`, `forecast_false_positive_count`, `forecast_miss_count`.

Een stijgende trend of een forecast miss is aanleiding om generator, template, classifier, schedulingregel of skill te verbeteren — niet om de veiligheidscontrole te verzwakken.


## Productiebewijs

Deze optimalisatielaag is via PR #2114 protected gemerged en teruggelezen op `main`.

- candidate head: `87ac4eb16ae5e78ac54f45603f06b5086858c80c`
- merge SHA: `f76bfbbccbc6dd256590dad1e95bc75985d9a351`
- Required: success
- Unified BRAIN: success
- CodeQL: success
- main readback: verified

Daarmee is de status `ACTIVE_PREVENTION_PROVEN`.
