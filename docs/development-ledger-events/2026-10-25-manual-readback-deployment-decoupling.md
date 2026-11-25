# Development ledger — manual-readback-deployment-decoupling-20261025

- Date: 2026-10-25
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4953
- Root cause: `forceBrowser` also implied `deploymentRequired`.
- Code: delivery applicability and existing production readback workflow.
- Regression: tests/netlify/deployment-evidence-status.test.mjs.
- Required run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40233753638 (initial closure admission incomplete).
- Protected merge: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/commit/72e3afef2c02e22835d2b711ecec65298fc96e62.
- Production readback: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40278768820 (workflow_dispatch on main, exact merge SHA, production-readback job success).
- Deployment applicability: NOT_REQUIRED; production routes and non-deployment evidence succeeded. Pricing-interactions step was skipped; do not infer its completion.
- Skill projection: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40241041144 (success).
- State: EVIDENCE_VERIFIED; administrative record promoted through protected PR with original provider run references.
