# SaaS customer loop readback recovery
Obligation-ID: saas-customer-loop-20261021-v1
Root cause: four known public build/readback files were absent from the canonical deployment authority.
Evidence: terminalizer 39553536765 failed with UNWIRED_NON_NETLIFY_RUNTIME_READBACK; source regression reproduced both runtime and verifier omissions.
Fix: three exact Netlify runtime paths plus one exact verifier-only path, preserving unknown-path rejection.
Regression: tests/brain-saas-readback-runtime-scope-v1.test.mjs, wired through the existing admission wrapper.
Prevention: keep source/build topology and canonical release classification aligned; never mark website runtime as governance to bypass readback.
Outcome: recovery candidate; provider/customer end-to-end payment is unproven. Parent #4215 stays open.
