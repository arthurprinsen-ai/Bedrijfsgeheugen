# Development ledger — production readback safe supersession v1

Date: 2026-09-25  
Obligation: `governance-production-trigger-ownership-v1`  
Fingerprint: `delivery|production-readback-safe-supersession|v1`

Canonical brand live readback expected `7fb8e80d…` while production had advanced to `582e58d7…`. Git comparison proved the intervening changes were only non-production borging/control-plane artifacts.

Added a shared Git ancestry + path-diff supersession evaluator. Exact SHA remains valid. A newer descendant is accepted only if all changed paths are in the explicit non-production allowlist. Runtime/tool/site/backend changes remain hard failures.
