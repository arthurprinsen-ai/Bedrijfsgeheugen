# Commercial outcome signal ingest

External commercial evidence may only auto-settle an outcome when it is explicit, verified, high-confidence and matches the exact open canonical revenue prediction. The ingest layer performs no settlement or persistence itself; it dispatches the existing `RECORD_OUTCOME` command with deterministic idempotency and evidence lineage.
