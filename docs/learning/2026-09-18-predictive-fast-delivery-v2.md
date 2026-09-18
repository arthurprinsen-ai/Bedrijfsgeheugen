# Predictive Fast Delivery v2 — 2026-09-18

## Doel

De Powerhouse ontwikkelstraat moet veilige wijzigingen in minuten van intent naar LIVE & BEWEZEN brengen, zonder passief wachten op queues, drift, stale PRs, time-outs of brede irrelevante tests.

## Incident learning

Op 18 september 2026 waren tegelijk zichtbaar:
- meerdere overlappende PR-lineages;
- stale/diverged merge-bases;
- open PR-heads zonder workflow-runs;
- queued/in-progress runs die door supersession waardeloos werden;
- Required groen terwijl BRAIN rood was op stale regressie-oracles;
- een false-positive oracle die `bytes.buffer` verwarde met het Buffer publicatieplatform.

De fout zat daardoor niet alleen in CI-capaciteit, maar in de besturing van work-in-progress, gate-selectie en recovery.

## Nieuwe ontwikkelstraat

1. **Predict before fan-out.** De controller classificeert risico op basis van changed paths, contract-/dependency-overlap en historische queue/failure/conflict-signalen.
2. **Parallel where independent.** Frontend, backend, QA en documentatie werken geïsoleerd parallel. Alleen echte path/contract/dependency/mutable-resource collisions serialiseren.
3. **One rolling candidate per conflict contract.** Parallel agent work betekent niet parallelle concurrerende PR-waarheden.
4. **Adaptive gates.** Alleen veranderde risico-, dependency-, contract-, security-, data/schema- en exacte productie-readbackgates blokkeren. Niet-gerelateerde brede assurance draait shadow/post-merge.
5. **Always-on delivery supervisor.** Elke vijf minuten controleert de supervisor open PR-heads op zero-run, stale-run, timeout en conflict. Zero-run en stale-run worden op dezelfde lineage opnieuw gedispatched; superseded runs worden gecanceld.
6. **No passive queue state.** Een SLO-breach is een recoverable incident en activeert herstel.
7. **Exact-head promotion.** Alleen de exact geteste SHA mag via BG169 promoveren.
8. **Production truth.** Merge/deploy is geen eindstatus. Productie/provider-readback en outcome-evidence blijven verplicht.
9. **Daily calibration.** Voorspelde risico's worden vergeleken met echte uitkomsten. Drempels, gate-profielen, conflict-contracten, turbo-allowlist, cache en recovery worden alleen aangepast als lead time verbetert zonder quality/security/reliability regressie.

## Agentrollen

- **Coordinator:** canonieke waarheid, scope, conflict-contracten, integratie en definition of done.
- **Frontend agent:** UI-delta, responsive/visual/browser checks.
- **Backend agent:** API/data/runtime, contract/security/schema checks.
- **Test & QA agent:** impact-afgeleide regressies, evals en detectie van false-positive oracles.
- **Release supervisor:** zero-run/stale-run/timeout/conflict recovery, promotion en readback.
- **Learning agent:** root cause, incident clustering, voorspelling-calibratie en skill/prevention writeback.

Dit zijn rollen binnen één Powerhouse-organisme, geen losse delivery-authoriteiten.

## SLO's

- first CI signal: <= 60s
- TURBO blocking path: <= 240s
- STANDARD blocking path: <= 480s
- zero-run recovery: <= 60s
- stale-run supersession: <= 90s
- repeat known incident without reused learning: target 0

## Guardrails

Snelheid mag nooit worden gekocht door security, tenant isolation, data-integrity, schema-integrity, exact candidate identity, rollback-readiness of productie-readback te verzwakken. Onbekende materiële scope blijft fail-closed.

## Canonieke implementatie

- `config/powerhouse-fast-development-protocol-v2.json`
- `config/powerhouse-parallel-engineering-fabric.json`
- `config/brain-delivery-system.json`
- `tools/delivery/predictive-controller.mjs`
- `.github/workflows/powerhouse-fast-delivery-supervisor.yml`
- `brain/skills/powerhouse-fast-rolling-delivery-v1.json`
- `brain/learning/2026-09-18-fast-rolling-lane-delivery-v1.json`
- `tests/brain-powerhouse-delivery-supervisor.test.mjs`
- `tests/brain-fast-development-protocol-v2.test.mjs`

Status van deze kandidaat blijft RECORDED_PENDING_FINAL_DELIVERY_READBACK totdat exact-head gates, protected promotion, productie-readback en learning-readback aantoonbaar groen zijn.
