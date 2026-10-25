# Development ledger: branch drift guard

Obligation: powerhouse-branch-drift-guard-20261025.

Source incident: PR #4907 required branch synchronization after repeated failures; comparing commit counts alone is not a safe decision rule. Reference: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4907

Change: new deterministic, read-only branch drift assessment using existing delivery overlap policy; tests for exact-head validity, contract overlap, active writer lease, and closed PRs. Does not create a scheduler or directly update any branch.

Status: implementation committed; Required/CodeQL/production evidence not yet verified. Live branch mutations stay under the canonical GitHub owner and branch protection.
