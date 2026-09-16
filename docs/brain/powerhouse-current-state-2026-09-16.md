# Bedrijfsgeheugen Powerhouse — Canonical Current State

Datum: 2026-09-16
Status: `RECOVERING`
Canonical status fingerprint: `powerhouse-current-state-2026-09-16`

Deze pagina is de menselijk leesbare actuele operationele status van het Bedrijfsgeheugen Powerhouse. Zij vervangt geen runtime-evidence, Supabase-state, production readback of component authority. Bij verschil wint actuele productie-evidence.

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

## 4. Reeds canoniek geïntegreerd

- PR #1787: hard-boundary fail-closed Completion Supervisor baseline op `main`; externe blokkade is geen succesvolle completion en blijft resumable.
- PR #1781: predictive production-lineage reconciliation.
- PR #1782: fail-closed social provider identity/artifact readback.
- PR #1783 plus #1790/#1791: Autonomous Improvement Runtime en productie-taxonomy recovery.
- PR #1774: unieke Engineering OS closed-loop delta.
- PR #1772/#1771/#1793: Quality Intelligence/Autopilot, accessibility closure en mutation-coverage reconciliation.

Oude branches/PR's die door deze opvolgers zijn vervangen zijn historische lineage, geen actieve authority.

## 5. Actieve materiële obligations

### OBL-CS-1797 — Completion Supervisor canonical reconciliation

Status: `RECOVERING`
Authority: PR #1797, branch `reconcile/completion-supervisor-live-verified-v1`.

Doel:
- de gemergde #1787 hard-boundary/resume guardrails combineren met de bredere zeven-evidence, identity-bound ingestie, idempotente backfill en documentatie uit de voormalige #1792-lijn;
- één Completion Supervisor-authority behouden.

Reeds gedaan:
- stale #1792 gesloten als superseded;
- mislukte mechanische sync #1794 gesloten en niet als authority gebruikt;
- fresh-main merge lineage gemaakt;
- #1787-only hard-boundary/shadow/backfill/resume guardrails behouden;
- Quality Intelligence current-main delta behouden;
- Make uit de connector-learning authority verwijderd en als retired vastgelegd.

Nog vereist voor closure:
1. alle exact-head protected CI/gates groen;
2. protected merge naar actuele `main`;
3. BG169/protected production promotion evidence;
4. Production Release Readback op de exacte productie-identiteit;
5. echte canary: partial obligation → recovery of `WAIT_EXTERNAL` → resume → `LIVE_VERIFIED`;
6. duurzame Supabase/Brain obligation/evidence readback;
7. BG167 capability handoff plus BG168/BG166 learning writeback/readback;
8. geen resterende materiële Completion Supervisor-obligation.

Tot deze acht punten bewezen zijn blijft de status `RECOVERING`.

### OBL-SUPABASE-1784 — final production-ledger source reconciliation

Status: `RECOVERING`.

PR #1784 bevat nog een unieke source-control delta rond de exact in productie waargenomen migration identities:
- `20260916123944_powerhouse_autonomy_rpc_replay_hardening`
- `20260916123957_powerhouse_internal_view_replay_hardening`

Productie-readback op de historische kandidaat bewees de runtime/security-state, maar de PR is gebaseerd op een oudere `main` en mag niet blind worden gemerged. Closure vereist fresh-main reconciliation van alleen de nog unieke delta, exact-head security/replay/Required/BRAIN gates, protected merge en source↔production-ledger readback. Geen DDL wordt opnieuw uitgevoerd wanneer productie de exacte statement-identiteit al bevat.

## 6. Niet-materiële/open maintenance

Dependabot- en overige onderhouds-PR's zijn geen bewijs dat Powerhouse-productie stuk is. Zij blijven maintenance backlog totdat compatibility/security/correctness evidence de wijziging verantwoordt. Ze mogen niet worden gebruikt om `LIVE_VERIFIED` te blokkeren tenzij een actuele dependency/security gate ze als materiële obligation classificeert.

Historische product/portal branches worden niet automatisch als actieve authority behandeld; alleen een actuele, unieke, niet-gemergde capability-delta met bewijs wordt een materiële obligation.

## 7. Documentatie-authority en driftregel

- `docs/development-ledger.md` blijft append-only engineering learning/evidence memory.
- `docs/brain/component-registry.json` beschrijft componenttopologie maar is niet automatisch actuele runtime health; een oude `generated_at` mag niet als productie-readback worden geïnterpreteerd.
- Deze current-state pagina benoemt actuele materiële closure obligations totdat runtime/registry regeneration de state opnieuw projecteert.
- Na structurele Powerhouse-wijzigingen moeten System Map, component registry, menselijk handboek en relevante learning/decision lineage worden gecontroleerd en waar nodig bijgewerkt.

## 8. Definition of Done voor Powerhouse-totaal

Het totale Powerhouse mag pas als `LIVE_VERIFIED` worden gerapporteerd wanneer:

- alle materiële authorities op actuele protected `main` staan;
- exact-SHA productie-identiteit bekend en teruggelezen is;
- functionele productie-readbacks groen zijn;
- open materiële obligations = 0, of een bewezen externe boundary expliciet als `WAIT_EXTERNAL` actief blijft zonder als succes te tellen;
- failures/root causes/prevention in dezelfde canonical lineage zijn vastgelegd;
- capability handoff en learning writeback aantoonbaar duurzaam zijn;
- documentatie geen retired authority als actieve route presenteert.

Tot die tijd moet iedere agent/chat de concrete open obligation tonen in plaats van `klaar`, `resolved` of `LIVE_VERIFIED` te claimen.
