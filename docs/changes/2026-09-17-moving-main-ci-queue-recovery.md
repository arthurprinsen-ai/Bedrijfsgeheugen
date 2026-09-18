# Moving-main + pre-run CI queue recovery — 2026-09-17

## Samenvatting

Tijdens herstel van #1510 via PR #1907 waren de relevante GitHub Actions-workflows wel aangemaakt, maar bleven Required, BRAIN, CodeQL, trust/security en V18 vóór runner-toewijzing `queued`. Tegelijk liep `main` door door andere merges. Daardoor waren twee waarheden tegelijk nodig: de codefix zelf kon inhoudelijk correct zijn, maar zonder uitgevoerde exact-head gates en actuele current-main-lineage mocht geen merge- of liveclaim volgen.

Canonical fingerprint: `moving-main-plus-pre-run-ci-queue-v1`.

## Waargenomen bewijs

- Oude PR-head: `b9b197e6b6d654370369f6ef3caf71a35e76e8d7`.
- Oude base: `012784b904cddbdec26d9f93fecb2eff26324a2f`.
- Eerste current-main herstelbase: `052327065e9f4ac88efdd909cc5c12582295862c`.
- Herbouwde candidate: `7844a83eaee8185f69bb81402921f657019d8b3a`.
- Tijdens deze learning-writeback was protected main alweer verder naar `eeadabbb7dbef337953dd6abbfb0445bfe673296`.
- Repository-brede diagnose: 315 queued runs en 14 in-progress runs.
- Required run: `35211285731`; BRAIN: `35211285493`; CodeQL: `35211285425`; trust: `35211285423`; V18: `35211285448`.

## Root cause

De primaire blokkade was externe GitHub Actions dispatch/capaciteit: workflows bestonden, maar hadden nog geen runner en dus geen uitvoeringsresultaat. De secundaire release-risicoversterker was moving main: terwijl bewijs ontbrak, veranderde de protected-main ancestry door onafhankelijke merges.

## Correct herstelgedrag

1. Classificeer `queued` vóór runner-executie als `BLOCKED_EXTERNAL_CI_EXECUTION`, nooit als PASS of FAIL.
2. Omzeil required checks niet en merge niet op basis van stale workflow-evidence.
3. Als de current-main guard vereist dat de kandidaat op actuele main ligt, reapply alleen de reeds gevalideerde delta op current main; voeg geen unrelated changes toe.
4. Laat alle exact-head gates opnieuw uitvoeren op de nieuwe candidate.
5. Lees protected main onmiddellijk vóór merge opnieuw uit.
6. Merge alleen met expected-head bescherming.
7. Sluit #1510 pas na productie-readback van exact `commit_ref`, `context=production` en concrete Netlify `deploy_id`.

## Bestaande Powerhouse-regels die dit afdwingen

- `REFRESH_BASE_BEFORE_FINAL_GATE`
- `BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE`
- `REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN`
- `REFRESH_MAIN_IMMEDIATELY_BEFORE_PRODUCTION_PERSISTENCE`
- `REQUIRE_OUTCOME_EVIDENCE_BEFORE_GREEN`

Er is bewust geen parallelle queue, nieuwe release-authority of duplicaat-preventieregel gemaakt. Dit incident is een concrete bewezen toepassing van bestaande Powerhouse-guards.

## Open obligation

Status blijft niet-terminaal zolang exact-head gates niet terminal groen zijn en productie-readback ontbreekt. Hervatpunt:

`terminal exact-head gates -> current-main recheck -> protected merge expected head -> production release.json/deploy-ID/exact-SHA readback -> #1510 sluiten`

## Reuse

Toekomstige agents moeten vóór nieuwe diagnose zoeken op `moving-main-plus-pre-run-ci-queue-v1`. Bij match: laad de learning-record, hergebruik de bestaande guards, controleer actuele main/head en onderscheid expliciet transport/queue-state van echte execution evidence.
