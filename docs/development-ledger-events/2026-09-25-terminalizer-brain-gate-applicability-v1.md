# Development ledger — terminalizer BRAIN gate applicability v1

Date: 2026-09-25
Obligation: `terminalizer-brain-gate-applicability-v1`
Fingerprint: `delivery|terminalizer-brain-gate-applicability|v1`

## Incident
PR #3108 merged with Required, Skill Projection and CodeQL green. Its terminal closure remained stuck in "Verify exact-head critical delivery gates" because the terminalizer waited for `unified-brain-delivery.yml` with `event=pull_request`, while that workflow is `workflow_dispatch`-only.

## Repair
Docs lane now skips BRAIN as not applicable. Non-docs lanes still require exact-head BRAIN success and accept the workflow's actual dispatch event.

## Prevention
Regression binds terminalizer expectations to the authoritative Unified Brain trigger contract.
