# RED proof

The regression test is intentionally committed before the production fix. On the current branch, `powerhouse-content-loop` still invokes the orchestrator before the `audit_only` social-publisher call, so the new ordering assertion should fail until the supervisor is corrected.
