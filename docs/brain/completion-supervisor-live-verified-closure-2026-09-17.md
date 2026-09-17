# Completion Supervisor — LIVE_VERIFIED closure & reusable learning

Datum: 2026-09-17
Fingerprint: `powerhouse-completion-supervisor-v1`
Status van deze capability-lineage: `LIVE_VERIFIED`
Scope: Completion Supervisor, Outcome Obligation Sweep, active backfill/resume, final Supabase production-ledger identity reconciliation.

## Doel van dit document

Dit document is de menselijk leesbare recovery- en evidence-samenvatting voor volgende Powerhouse-agents. Het vervangt geen GitHub Actions evidence, Supabase obligation/evidence lineage of production readback. Bij verschil wint actuele runtime evidence.

## Oorspronkelijk probleem

Powerhouse kon technisch werk lokaal afronden terwijl productie-readback, durable writeback of een andere outcome obligation nog open stond. Een bewezen harde externe boundary kon daardoor te vroeg als eindstatus worden behandeld. De kernfout was dat lokale voortgang, wachttoestand en succesvolle completion niet hard genoeg waren gescheiden.

## Canonieke oplossing

Completion Supervisor is de fail-closed completion decision binnen dezelfde bestaande Powerhouse-keten. `LIVE_VERIFIED` vereist dezelfde exacte change-/obligation-identiteit over zeven evidenceklassen:

1. `CANDIDATE_TESTS`
2. `PROTECTED_DELIVERY`
3. `PRODUCTION_IDENTITY`
4. `FUNCTIONAL_READBACK`
5. `OBLIGATIONS_COMPLETE`
6. `CAPABILITY_HANDOFF`
7. `LEARNING_WRITEBACK`

`WAIT_EXTERNAL` en andere partial states blijven actief, behouden hun recovery packet en hervatten hetzelfde work-item. Er is geen parallelle completion store, queue of brain toegevoegd.

## Incidenten die tijdens closure zijn gevonden en opgelost

### 1. Required concurrency was niet SHA-specifiek genoeg

**Symptoom:** een stale queued Required-run kon de actuele kandidaat blokkeren terwijl completion evidence zelf exact-head/SHA-bound is.

**Root cause:** de concurrency group gebruikte primair PR-nummer en niet de volledige candidate identity.

**Fix:** Required concurrency candidate-SHA scoped gemaakt.

**Preventie:** de identity van scheduling/concurrency mag nooit grover zijn dan de identity van de evidence die ermee wordt beschermd.

### 2. Dynamische BRAIN run-name werd als workflow-identiteit gebruikt

**Symptoom:** Outcome Obligation Sweep classificeerde een geldige BRAIN workflow-run als niet-toepasselijk; daarna liep durable evaluation toch door.

**Root cause:** `workflow_run.name` kon de dynamische run-name bevatten en is geen stabiele machine-identiteit. De no-op-classificatie begrensde bovendien niet alle downstream durable stappen.

**Fix:** classify op stabiele `workflow_run.path`; niet-toepasselijke events stoppen vóór durable evaluation, backfill en artifact-upload.

**Preventie:** path/id voor machine authority, display/run-name alleen voor mensen.

### 3. Hard-boundary snapshot had legacy camelCase

**Symptoom:** active backfill hervatte één obligation terwijl een harde boundary actief was.

**Root cause:** legacy/collected snapshot gebruikte `hardBoundary.recoveryPacket`, terwijl canonical policy `hardBoundary.recovery_packet` verwacht.

**Fix:** alleen de backfill-adapter normaliseert de legacy vorm naar canonical snake_case vóór policy-evaluatie.

**Preventie:** canonical policy niet vervuilen met legacy varianten; schema-normalisatie hoort op de ingress/adaptorgrens.

### 4. Immutable evidence stond in hidden `.artifacts/**`

**Symptoom:** runtime en resumes slaagden inhoudelijk, maar `actions/upload-artifact@v4` rapporteerde geen bestanden.

**Root cause:** hidden directories worden standaard uitgesloten.

**Fix:** `include-hidden-files: true` op de bestaande evidence-upload plus regressiecontract.

**Preventie:** evidence storage is onderdeel van de feature. Een runtime mag niet `LIVE_VERIFIED` worden alleen omdat de businesslogica slaagt; immutable bewijs moet aantoonbaar duurzaam zijn opgeslagen.

### 5. Recovery output kon opnieuw recovery input worden

**Symptoom:** resume-output kon terugkomen als nieuwe backfill-kandidaat.

**Root cause:** selectie maakte onvoldoende onderscheid tussen oorspronkelijke partial obligations en records die door de recovery executor zelf zijn geproduceerd.

**Fix:** PR #1841 voorkomt recursive resume rows.

**Preventie:** recovery is altijd idempotent én non-recursive. Een executor-output wordt niet opnieuw werk zonder een nieuwe expliciete state transition.

## Wat niet meer gedaan mag worden

- Geen `Resolved` op basis van local green, merge-acknowledgement of deploy-acknowledgement alleen.
- Geen harde boundary als succesvolle terminale uitkomst opslaan.
- Geen betekenisloze commit pushen om queued runners “wakker te maken”; dat reset exact-head evidence en maakt de queue groter.
- Geen workflow display/run-name als durable identity gebruiken.
- Geen legacy schema-varianten verspreiden door canonical policy.
- Geen reeds toegepaste Supabase DDL replayen om alleen source/ledger identity drift te corrigeren.
- Geen nieuwe brain, queue, completion store, scheduler of recovery database naast Agent Fabric + Outcome Obligations + Supabase lineage bouwen.

## Production evidence die de closure bewees

### Protected delivery / merges

- PR #1797: canonical Completion Supervisor reconciliation protected gemerged.
- PR #1798: final Supabase production-ledger source reconciliation protected gemerged; DDL niet gereplayed.
- PR #1811: Outcome Obligation Sweep workflow-run/no-op repair.
- PR #1828: hard-boundary adapter-normalisatie protected gemerged; merge SHA `42da631...`.
- PR #1835: immutable hidden-artifact upload protected gemerged; merge SHA `560e9657c50c6bcf406591c0502478c38b78bdba`.
- PR #1841: non-recursive resume rows protected gemerged.

### Active backfill production proof

Run: `35128198434`
Head SHA: `374d6b1dae19290b3bc1560fb0c44f08ba50965d`
Conclusion: `success`

Bewezen succesvolle stappen:
- `Verify Completion Supervisor active backfill contracts`
- `Collect existing authorities and resume canonical obligations idempotently`
- `Upload immutable reconciliation and resume evidence`

Immutable artifact:
- naam: `completion-supervisor-backfill-resume-35128198434`
- digest: `sha256:8cd5b9b28f7ec42f42505935c2f4f91cbf7f034293d8d2a02290f282309841ff`

### Durable obligation/readback proof

Outcome Obligation Sweep run: `35128230584`
Conclusion: `success`

Bewezen succesvolle stappen:
- `Persist trusted completion evidence in the existing obligation lineage`
- `Evaluate obligations without production mutation`
- `Reconcile partial decisions into the same obligation lineage`

Dit is het bewijs dat de recovery niet eindigde bij code/CI, maar in dezelfde duurzame Powerhouse obligation/evidence lineage is teruggeschreven.

## Supabase production-ledger reconciliation

De volgende production identities zijn als bestaande production truth behandeld:
- `20260916123944_powerhouse_autonomy_rpc_replay_hardening`
- `20260916123957_powerhouse_internal_view_replay_hardening`

Regel: source-control identity mag met production ledger truth worden gereconcilieerd; reeds toegepaste productie-DDL wordt niet opnieuw uitgevoerd om documentatie/source parity te herstellen.

## Reusable decision rules voor agents

1. **Classificeer status vóór actie.** `LIVE_VERIFIED`, `WAIT_EXTERNAL`, `RECOVERING`, `FAILED_REQUIRES_FIX` zijn verschillende toestanden.
2. **Behoud één obligation identity.** Partial → wait → resume → readback → closure blijft één work-item, tenzij er aantoonbaar een nieuwe change ontstaat.
3. **Gebruik onafhankelijke evidence-producers.** Candidate tests mogen niet hun eigen production proof fabriceren.
4. **Fail closed op ontbrekende evidence.** Missing artifact/readback/store = niet klaar.
5. **Normaliseer alleen aan boundaries.** Canonical core contracts blijven streng.
6. **Controleer opslag, niet alleen berekening.** Een gegenereerd report zonder duurzaam artifact/writeback is geen closed loop.
7. **Voorkom recursion.** Recovery-resultaten mogen niet automatisch nieuwe recovery-input worden.
8. **Synchroniseer fresh main alleen wanneer nodig.** Geen force/bypass; preserve unique delta en herbewijs exact head.
9. **Bij runnerqueue: verander niets.** Poll dezelfde SHA; fix alleen een bewezen failure.
10. **Schrijf learning terug.** Symptom, root cause, failed approach, fix, evidence, prevention en reusable rule horen in dezelfde Powerhouse lineage.

## Canonieke verwijzingen

- Machine-readable learning: `brain/learning/completion-supervisor-v1-2026-09-16.json`
- Current state: `docs/brain/powerhouse-current-state-2026-09-16.md`
- Engineering ledger: `docs/development-ledger.md`
- Completion policy/runtime: `brain/policy/completion-readiness.mjs`, `platform/agents/completion-supervisor.mjs`
- Outcome obligations: `config/outcome-obligations.json`, `tools/outcome-obligation-runtime.mjs`, `tools/outcome-obligation-supabase-store.mjs`
- Active backfill: `tools/outcome-obligation-completion-supervisor-backfill.mjs`
- Backfill workflow: `.github/workflows/completion-supervisor-backfill-shadow.yml`
- Outcome sweep: `.github/workflows/outcome-obligation-sweep.yml`

## Closure rule

Deze lineage mag pas opnieuw van `LIVE_VERIFIED` afwijken wanneer nieuwe runtime evidence een concrete regressie of nieuwe open obligation aantoont. Een latere repository/main-SHA alleen is geen regressie; status moet opnieuw worden afgeleid uit de actuele capability evidence, niet uit documentouderdom.
