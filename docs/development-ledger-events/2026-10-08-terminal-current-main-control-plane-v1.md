# Structural recovery: terminal current-main checkout

- Source: [PR #4118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4118) protected merged; terminal identity resolver [PR #4123](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4123) merged; terminal rerun [#37757904129](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37757904129) failed.
- Failure identity: `ERR_MODULE_NOT_FOUND` in current control-plane import from stale #4118 historical checkout.
- Root cause: executable terminal workflow source and checked-out historical evidence revision diverged.
- Recovery: checkout immutable invocation `github.sha` from main; preserve old `MERGE_SHA` and `HEAD_SHA` as evidence; enforce ancestor containment in both current main and checked-out revision.
- Tests: `tests/brain-fast-terminal-delivery-v2.test.mjs`; preserve exact migration and all protected provider gates.
- Closure: only successful protected merge and new independent post-merge terminal readback count.
- Status: `PENDING_PROTECTED_DELIVERY`; no terminal proof fabricated.
