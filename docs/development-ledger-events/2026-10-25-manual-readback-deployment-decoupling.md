# Development ledger — manual-readback-deployment-decoupling-20261025

- Date: 2026-10-25
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4953
- Root cause: `forceBrowser` also implied `deploymentRequired`.
- Code: delivery applicability and existing production readback workflow.
- Regression: tests/netlify/deployment-evidence-status.test.mjs.
- Required run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40233753638 (initial closure admission incomplete).
- Follow-up: Required/CodeQL and protected merge; separate evidence that an actual deployed runtime is healthy.
- State: CANDIDATE, no false-green provider proof.
