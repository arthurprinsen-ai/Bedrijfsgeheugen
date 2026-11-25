# Development ledger: trusted admission policy survives old PR checkouts
Date: 2026-10-23
Obligation: github|admission|workflow-candidate-version-skew-missing-helper|20261023-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Observation: Required 39948460112 failed at an import of a helper absent from exact candidate HEAD, although already merged in the workflow version.
Root cause: different source epochs for workflow and candidate checkout.
Fix candidate: git-show classifier from immutable workflow_sha into runner temp, no checkout mutation; deny admission on unresolved source.
Regression: disposable git fixture old HEAD, rate-limit vs permission 403, invalid pin fail closed.
Gates: exact-head Required and CodeQL, protected merge; post-merge monitor actual existing PR admission, no self-declared live proof.
Outcome: NOT YET VERIFIED; no customer value claim.
