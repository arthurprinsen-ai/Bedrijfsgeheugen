# One original innovation delivery continuity: build → verify deployment → measure (17 November 2026)

Parent original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Actual defect

Original EU production registered 14 canonical INNOVATION_DELIVERY obligations OPEN and 14 INNOVATION_INTAKE operations PLANNED (13 engineering, one CRO). Nine require a source-backed baseline, four a concrete protected code change and one a consent-safe CRO holdout. The original daily Self Evolution selected a bounded code candidate and delivered a native protected PR; candidate 2c1ecc77 was merged in https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908. Its original Brain operation still had no independent protected deployed/agent consumer acknowledgement or measured effect. The terminalization workflow for that PR failed a historical required BRAIN gate, so no invented closure is permitted.

## Source-owned implementation

Add **one readback step** to the original `.github/workflows/powerhouse-daily-self-evolution.yml` **improve job** after existing original owner decisions. `if: always()` means this step can run even if an unrelated earlier improvement step fails. It uses only the existing GitHub workflow, original Supabase sources, original brain_operations CAS and independent GET; no second scheduler, agent, queue, database or release path.

`scripts/brain/innovation-original-delivery-continuity.mjs` reads all candidate/obligation/operation rows with exact paginated source counts. Fail closed for duplicate, orphan, owner, payload SHA or source revision drift. Distinct stages: baseline design due, CRO consent and holdout due, protected engineering build due, unchanged-source owner review due, PR review due, GitHub head drift, merged PR waiting production proof, and verified production source waiting independent impact evidence. Existing source-linked PR is fetched from native GitHub API. An optional native Netlify production READY deploy is accepted only if its SHA is a GitHub-proven descendant of the protected merge SHA. A success code from a workflow is not the production provider's proof.

Store only source-bound nonterminal evidence in `brain_operations.evidence.original_innovation_continuity` using original `brain_transition_operation` expected version CAS, followed by independent GET. Stable assessment fingerprints prevent needless repeated CAS writes on identical daily observations. No PR creation, provider outbound send, external mutation or terminalization is performed by this watcher.

## Effect and economic truth

Even after a native READY deployment, `actual_impact`, `expected_impact`, `holdout_impact` and `independent_heartbeat_learning_verified` remain unproven. This phase **does not implement independent business effect measurement itself**. CRO requires consent-safe exposure and holdout, Engineering needs a runtime baseline and after-value, and other innovation types require native action/provider outcomes. Original statuses remain PLANNED/OPEN until their respective source-owner and Heartbeat effect contracts can be independently verified. Missing Netlify credentials, provider downtime, PR head drift, and stale metrics must appear as due/blocked, never as green.

## Release and rollback

Test `tests/brain-innovation-delivery-continuity-20261117.test.mjs`, including normal/negative source binding, preview rejection, deploy ancestry, staged delivery, and stable rechecks. Check protected Required + CodeQL + exact production workflow run. Rollback by protected revert of the new workflow step and script, preserving all historical original Brain evidence and operations. This fixes the recurring **continuity/readback** gap; a universal non-code *execution* and independent *outcome-measurement* engine still requires separate bounded implementation and consent/release controls.

### Additional original release reuse — no fictitious second deployment

The original operation for `2c1ecc77-58aa-4f25-ae68-e2337853fdc7` already contains both `original_code_candidate_release` and `original_code_production_readback` from the original verified protected PR #5908, including historical Netlify READY deploy `6afa1140fce862102329274e`, the initial PR source head, the later reviewed final PR source head, and original source revision/SHA. A naive comparison of the **initial** code-candidate head with the **final** PR head would wrongly classify legitimate protected corrections as stale.

The reconciliation now accepts the historical native release as `HISTORICAL_NATIVE_CODE_RELEASE_VERIFIED_EFFECT_MEASUREMENT_DUE` only after exact full original identity, final PR head, protected merge SHA, prior native provider readback and same operation lineage match. This is **historical proof only**. A new current-production-live claim still requires a fresh latest READY Netlify commit and independent GitHub ancestor check. No change to the original INNOVATION_INTAKE status or financial impact.

## Scoped same-workflow post-merge recovery
The existing `workflow_dispatch` input `execution_scope: original_delivery_recovery` runs **only** the same original readback script with `contents: read`, `actions: read`, `pull-requests: read`, no separate timer or code-writing agent. It excludes full daily/admission, model freshness and Codex candidate work, so a source repair or protected merge can be independently verified without duplicate daily dispatch or new external side effects. This path is meant for operator-authorized manual recovery; normal scheduling remains unchanged. Regression requires exact three daily job admission exclusions and one unchanged cron.
