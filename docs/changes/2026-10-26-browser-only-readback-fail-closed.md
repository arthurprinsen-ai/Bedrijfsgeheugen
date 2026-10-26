# Browser-only readback fail-closed — PR #4959

Obligation: `manual-readback-deployment-decoupling-20261025-browser-only-regression`.

The previous manual browser-only workflow incorrectly skipped pricing and English-language interactions without deployment and used hardcoded `routes-ok=true` in non-deployment verification. Preserve Netlify deployment applicability independently of browser verification. Pricing/browser outcome and route outcome must both succeed before LIVE_VERIFIED. The regression test covers absent deployment, failed routes, and workflow conditions. No extra deployment or disabled checks.

Required first rejected `activity_ledger,brain_learning,human_documentation` at run 40290681460; these three artifacts complete that canonical evidence bundle. This PR is not approved or live until exact-head Required/BRAIN/CodeQL, protected merge and independent production readback succeed.
