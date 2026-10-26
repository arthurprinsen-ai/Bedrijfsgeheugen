# Source Universe — historical learning projection recovery

## Root cause
PR #4108 merged at `ee9e6b19cfd93fac78dab1702f07cc09893fdf10`. Required and CodeQL passed, and post-merge protected production was live, but canonical learning run `37742411908` failed deterministically with `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:[object Object]`. The learning record contained a scenario object rather than an executable test-file path.

## Repair
- Existing Source Universe learning record now lists the existing Brain regression `tests/brain-source-universe-operational-truth-v1.test.mjs` for historical replay, shadow and canary, without inventing business impact or outcomes.
- The canonical Obligation Terminal Closure continues to prefer successful exact-merge skill projection.
- If original projection failed, require a successful **protected-main descendant** skill projection, both ancestor constraints, byte-identical required learning blobs at the successful run and current main, and valid Brain test paths; otherwise remain blocked.
- The original failed workflow run is never relabeled successful. No new scheduler, bypass, credential or authority layer is created.

## Evidence and acceptance
- Original Required: `37742193380` succeeded; Powerhouse CodeQL: `37742192989` succeeded.
- Production descendant readback: `99013007ea1b8fe062e5c96ec3c710d760ddcfe6`, Netlify deploy `6ac75fc85b7162000804fedf`, contains original merge; replay `37756500341` proved this.
- New protected Required/CodeQL, merge, successful main learning projection and a new canonical replay must all pass before declaring original PR #4108 `LIVE_BEWEZEN`.
- No false financial scores or verified outcomes are created. Source Universe guard receipts remain independent from a positive business-outcome claim.
