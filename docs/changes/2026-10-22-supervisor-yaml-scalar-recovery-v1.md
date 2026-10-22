# Supervisor YAML scalar recovery

Fingerprint: `github-actions|supervisor-reenable|unexpected-push-zero-jobs|20261022`.

The existing Delivery Recovery Supervisor cannot start jobs because its embedded AWK and Node programs escape the YAML `run: |` block. The workflow blob from failed run 39813685306 is identical to the inspected current-main blob. PyYAML 6.0.3 rejects line 311; a zero-job push-shaped failure alone therefore does not establish a provider-trigger defect.

The candidate adds only the missing scalar indentation around both embedded programs. YAML removes that indentation before shell execution, so the Node heredoc delimiter remains at shell column zero. The canonical supervisor regression now extracts literal shell blocks according to their indentation boundaries and checks them with `bash -n`. It requires only existing Node and bash; no parser dependency was added.

Local replay was 20 passing tests and one genuine truncated-shell failure before repair, then 21/21 passing after repair. Separate local actual-YAML parsing and all three parser-extracted shell scripts also pass. These results do not establish hosted CI or live controller recovery.

Publication belongs to the existing supervisor recovery lineage. PR #4008 covers same-lineage recovery but its inspected head still contains an invalid Node block; PR #4663 covers ghost capacity and does not repair this workflow. Protected source/security checks, provider readback and authorized bounded runtime verification remain open. The workflow was neither enabled nor dispatched; queue thresholds, schedules, leases and security gates were not changed.


## Canonical admission replay

Draft PR #4707 at head `5f2e2acaf9e203f8fd89033270d55bdabf6b4a88` failed Required run 39833774635 before runtime verification: `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/delivery-powerhouse-supervisor.test.mjs`. The canonical learning gate requires brain-prefixed test paths; a passing ordinary test was insufficient evidence.

The scalar regression now lives in `tests/brain-delivery-supervisor-yaml-scalar-v1.test.mjs`, with one exact automation-lane mapping in the existing classifier. The legacy supervisor file is restored to its original 20 tests. Learning historical replay, shadow and canary reference the canonical test. The guard remains unchanged. Before further CI, run the actual `evaluateLearningFile` entry point locally across all three modes, both test files, classifier routing, actual YAML parsing and extracted-shell syntax checks. Source publication must reconcile current main and the existing owner; local proof does not authorize stale-epoch landing or controller activation.

Executed admission-repair proof: unchanged `evaluateLearningFile` passes HISTORICAL_REPLAY, SHADOW and CANARY with `canonical_eligible=true`; new plus legacy tests pass 22/22. Source was reconciled read-only against current main `d41950ed3eed1758134fd82281c1023c1b6a22f5`: the supervisor, legacy test and classifier baseline match exactly. This is local successor preparation, not a hosted gate or live-recovery claim.
