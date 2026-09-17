# GREEN target

After the RED assertion is observed in CI, the minimal production change is to add the `audit_only` publisher invocation immediately after pre-reconciliation and before the orchestrator loop. The existing later audit remains as post-dispatch verification.
