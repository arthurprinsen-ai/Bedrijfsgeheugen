# Bedrijfsgeheugen Powerhouse — Canonical Current State

Datum: 2026-09-17
Status: `RECOVERING`
Canonical status fingerprint: `powerhouse-current-state-2026-09-16`

Deze pagina is de menselijk leesbare actuele operationele status van het Bedrijfsgeheugen Powerhouse. Zij vervangt geen runtime-evidence, Supabase-state, production readback of component authority. Bij verschil wint actuele productie-evidence.

> Statusnotitie 2026-09-17: de Completion Supervisor canonical reconciliation en de final Supabase production-ledger source reconciliation zijn afzonderlijk `LIVE_VERIFIED`/gesloten. De globale Powerhouse-status blijft `RECOVERING` totdat alle overige actuele materiële obligations via hun eigen authority zijn gesloten; deze pagina mag dus geen lokale closure van één capability verheffen tot een ongefundeerde totaalstatus.

## 1. Harde statusregel

Materieel Powerhouse-werk kent slechts één succesvolle terminale status: `LIVE_VERIFIED`.

`COMMITTED`, `MERGED`, `PREVIEW_READY`, `DEPLOYED_UNVERIFIED`, `DEELS LIVE`, `RECOVERING` en `WAIT_EXTERNAL` zijn tussenstaten of actieve hersteltoestanden. Een bewezen externe boundary mag nooit als succesvolle completion worden opgeslagen. Hetzelfde work-item/dezelfde obligation blijft actief en hervat wanneer de boundary verdwijnt.

## 2. Canonieke authorities

- GitHub protected `main` + BRAIN-DELIVERY-v2: source/candidate/integration evidence.
- BG169 Production Promotion Controller: productiepromotie-authority.
- Supabase/Powerhouse Outcome Obligations: duurzame obligation- en evidence-lineage.
- Agent Fabric: material work lifecycle, dedupe en resume.
- Completion Supervisor: completion decision; faalt gesloten.
- BG167: shared/current-state projection en capability handoff.
- BG168/BG166: outcome-, error- en learning-writeback binnen de huidige Powerhouse/Supabase-route.
- Production Release Readback en provider/runtime readbacks: functionele productie-evidence.
- Notion/documentatie: menselijke uitleg en besluitcontext; nooit runtime-authority.
- Make: `LEGACY_RETIRED_PATH`; geen runtime-, scheduler-, delivery-, replay- of learning-authority.

Geen parallelle brain, CRM, queue, scheduler, analytics store, learning store of completion store is toegestaan.

## 3. Completion Supervisor contract

`LIVE_VERIFIED` vereist voor dezelfde exacte change-/obligation-identiteit alle zeven vertrouwde evidenceklassen:

1. `CANDIDATE_TESTS`
2. `PROTECTED_DELIVERY`
3. `PRODUCTION_IDENTITY`
4. `FUNCTIONAL_READBACK`
5. `OBLIGATIONS_COMPLETE`
6. `CAPABILITY_HANDOFF`
7. `LEARNING_WRITEBACK`

Evidence van verkeerde identity, verkeerde producer, lokale claims of alleen workflow-acknowledgements bewijst geen completion.

Aanvullende bewezen closure-regels uit de 16/17-september recovery:
- release/concurrency identity moet minstens zo specifiek zijn als de SHA-bound evidence die zij beschermt;
- workflow-machine-identiteit gebruikt stabiele path/id, nooit dynamische run-name als authority;
- legacy camelCase/snake_case drift wordt één keer aan de adaptergrens genormaliseerd, niet in canonical policy;
- een runtime die inhoudelijk slaagt maar immutable evidence niet duurzaam kan opslaan is niet gesloten;
- recovery/backfill moet idempotent én non-recursive zijn;
- no-op/non-applicable classificatie moet alle downstream durable side effects begrenzen.

## 4. Reeds canoniek geïntegreerd

- PR #1787: hard-boundary fail-closed Completion Supervisor baseline op `main`; externe blokkade is geen succesvolle completion en blijft resumable.
- PR #1797: canonical Completion Supervisor reconciliation protected gemerged; zeven-evidence/identity-bound closure geïntegreerd.
- PR #1798: final Supabase production-ledger source reconciliation protected gemerged zonder reeds toegepaste DDL te replayen.
- PR #1811: Outcome Obligation Sweep workflow-run source/no-op closure gerepareerd.
- PR #1828: hard-boundary legacy snapshot normalization in de backfill-adapter protected gemerged.
- PR #1835: immutable hidden `.artifacts/**` evidence-upload gerepareerd met expliciete `include-hidden-files: true` contractborging.
- PR #1841: recursive resume rows in Completion Supervisor backfill voorkomen.
- PR #1781: predictive production-lineage reconciliation.
- PR #1782: fail-closed social provider identity/artifact readback.
- PR #1783 plus #1790/#1791: Autonomous Improvement Runtime en productie-taxonomy recovery.
- PR #1774: unieke Engineering OS closed-loop delta.
- PR #1772/#1771/#1793: Quality Intelligence/Autopilot, accessibility closure en mutation-coverage reconciliation.

Oude branches/PR's die door deze opvolgers zijn vervangen zijn historische lineage, geen actieve authority.

## 5. Gesloten materiële obligations — Completion Supervisor lineage

### OBL-CS-1797 — Completion Supervisor canonical reconciliation

Status: `LIVE_VERIFIED`.

Bewezen closure:
- protected exact-head delivery zonder branch-protection bypass;
- Production Release Readback op de gemergde production identity;
- trusted completion evidence persist in dezelfde Supabase/Outcome Obligation-lineage;
- partial decisions in dezelfde lineage gereconcilieerd;
- active backfill contracts groen;
- canonical obligations idempotent hervat;
- immutable reconciliation/resume evidence succesvol geüpload;
- hard-boundary snapshots blijven fail-closed;
- recursive resume output wordt niet als nieuwe recovery-candidate teruggevoed.

Belangrijkste productie-evidence:
- PR #1797 protected merge lineage;
- PR #1828 protected merge `42da631...` voor hard-boundary adapter-normalisatie;
- PR #1835 protected merge `560e9657c50c6bcf406591c0502478c38b78bdba` voor immutable hidden-artifact upload;
- Completion Supervisor Backfill Resume run `35128198434` op main SHA `374d6b1dae19290b3bc1560fb0c44f08ba50965d`: `success`;
- immutable artifact `completion-supervisor-backfill-resume-35128198434`, digest `sha256:8cd5b9b28f7ec42f42505935c2f4f91cbf7f034293d8d2a02290f282309841ff`;
- Outcome Obligation Sweep run `35128230584`: `success`, inclusief trusted evidence persist, durable evaluation en partial reconciliation.

Machine-readable learning authority: `brain/learning/completion-supervisor-v1-2026-09-16.json`.

### OBL-SUPABASE-1798 — final production-ledger source reconciliation

Status: `LIVE_VERIFIED`/gesloten voor deze obligation.

De stale #1784-lijn is superseded. #1798 heeft de source-control identities uitgelijnd met de reeds in productie waargenomen migration identities:
- `20260916123944_powerhouse_autonomy_rpc_replay_hardening`
- `20260916123957_powerhouse_internal_view_replay_hardening`

De closure heeft geen reeds toegepaste DDL opnieuw uitgevoerd. De preventieregel blijft: production-ledger reconciliation corrigeert identity/source drift; het is geen excuus om productie-DDL opnieuw af te spelen wanneer production truth al bestaat.

## 6. Herbruikbare learning uit de closure

1. **Waiting is not success.** Een queued runner, externe boundary of partial state blijft actief herstelwerk; alleen de vereiste evidenceklassen kunnen `LIVE_VERIFIED` bewijzen.
2. **Identity everywhere.** Candidate SHA, concurrency key, artifacts, production marker en obligation identity moeten dezelfde change-identiteit volgen.
3. **Stable identifiers over display names.** Workflow paths/IDs zijn machine-authority; dynamische run-names zijn presentatie.
4. **Normalize at ingress.** Legacy schema-afwijkingen horen in adapters; canonical policy blijft streng en klein.
5. **Evidence storage is part of the feature.** Een geslaagde runtime met mislukte immutable upload is niet af.
6. **Recovery must be idempotent and non-recursive.** Herstarten mag hetzelfde work-item hervatten, niet nieuwe afgeleide obligations blijven produceren.
7. **No parallel recovery brain.** Alle fixes hergebruiken Agent Fabric, Outcome Obligations, BRAIN delivery, Supabase lineage en bestaande readback-producers.
8. **No gratuitous SHA churn.** Bij queued runners geen betekenisloze commits pushen; dat vernietigt exact-head evidence en vergroot wachtrijen.

## 7. Niet-materiële/open maintenance

Dependabot- en overige onderhouds-PR's zijn geen bewijs dat Powerhouse-productie stuk is. Zij blijven maintenance backlog totdat compatibility/security/correctness evidence de wijziging verantwoordt. Ze mogen niet worden gebruikt om `LIVE_VERIFIED` te blokkeren tenzij een actuele dependency/security gate ze als materiële obligation classificeert.

Historische product/portal branches worden niet automatisch als actieve authority behandeld; alleen een actuele, unieke, niet-gemergde capability-delta met bewijs wordt een materiële obligation.

## 8. Documentatie-authority en driftregel

- `docs/development-ledger.md` blijft append-only engineering learning/evidence memory.
- `brain/learning/completion-supervisor-v1-2026-09-16.json` is de machine-readable failure/prevention/closure lineage voor deze capability.
- `docs/brain/completion-supervisor-live-verified-closure-2026-09-17.md` is de menselijke evidence- en recovery-samenvatting voor volgende agents.
- `docs/brain/component-registry.json` beschrijft componenttopologie maar is niet automatisch actuele runtime health; een oude `generated_at` mag niet als productie-readback worden geïnterpreteerd.
- Deze current-state pagina benoemt actuele materiële closure obligations totdat runtime/registry regeneration de state opnieuw projecteert.
- Na structurele Powerhouse-wijzigingen moeten System Map, component registry, menselijk handboek en relevante learning/decision lineage worden gecontroleerd en waar nodig bijgewerkt.

## 9. Definition of Done voor Powerhouse-totaal

Het totale Powerhouse mag pas als `LIVE_VERIFIED` worden gerapporteerd wanneer:

- alle materiële authorities op actuele protected `main` staan;
- exact-SHA productie-identiteit bekend en teruggelezen is;
- functionele productie-readbacks groen zijn;
- open materiële obligations = 0, of een bewezen externe boundary expliciet als `WAIT_EXTERNAL` actief blijft zonder als succes te tellen;
- failures/root causes/prevention in dezelfde canonical lineage zijn vastgelegd;
- capability handoff en learning writeback aantoonbaar duurzaam zijn;
- documentatie geen retired authority als actieve route presenteert.

Een capability die afzonderlijk `LIVE_VERIFIED` is, zoals de hier beschreven Completion Supervisor closure, bewijst dus niet automatisch dat alle andere Powerhouse-capabilities eveneens gesloten zijn.
