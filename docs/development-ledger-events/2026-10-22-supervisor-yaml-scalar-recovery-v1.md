# Development ledger: supervisor YAML recovery candidate

Date: 2026-10-22. Fingerprint: `github-actions|supervisor-reenable|unexpected-push-zero-jobs|20261022`.

Source baseline: protected main `6258ec1be551afebfb4d475c91394824047a2fdc`; supervisor blob `746c19281b5042950c26ad5081b2a40dd36411ae`. The same blob exists at failed run 39813685306's exact revision. Root cause is executable source syntax: column-zero AWK and Node text outside the YAML run scalar.

Local candidate: indent both blocks, add a real truncated-shell regression to the existing owned supervisor suite, and preserve the original controller behavior. RED: 20/1. GREEN: 21/0. Independent PyYAML parse PASS and extracted shell `bash -n` 3/3. No new dependency, scheduler, external write, workflow enable or dispatch.

State: CANDIDATE / RECOVERING, not live proven. Existing recovery ownership, protected exact-head checks, main readback, incident-registry writeback, skill projection and authorized bounded live verification remain obligations of the same lineage.


## Canonical admission replay

Draft PR #4707 at head `5f2e2acaf9e203f8fd89033270d55bdabf6b4a88` failed Required run 39833774635 before runtime verification: `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/delivery-powerhouse-supervisor.test.mjs`. The canonical learning gate requires brain-prefixed test paths; a passing ordinary test was insufficient evidence.

The scalar regression now lives in `tests/brain-delivery-supervisor-yaml-scalar-v1.test.mjs`, with one exact automation-lane mapping in the existing classifier. The legacy supervisor file is restored to its original 20 tests. Learning historical replay, shadow and canary reference the canonical test. The guard remains unchanged. Before further CI, run the actual `evaluateLearningFile` entry point locally across all three modes, both test files, classifier routing, actual YAML parsing and extracted-shell syntax checks. Source publication must reconcile current main and the existing owner; local proof does not authorize stale-epoch landing or controller activation.

Executed admission-repair proof: unchanged `evaluateLearningFile` passes HISTORICAL_REPLAY, SHADOW and CANARY with `canonical_eligible=true`; new plus legacy tests pass 22/22. Source was reconciled read-only against current main `d41950ed3eed1758134fd82281c1023c1b6a22f5`: the supervisor, legacy test and classifier baseline match exactly. This is local successor preparation, not a hosted gate or live-recovery claim.
