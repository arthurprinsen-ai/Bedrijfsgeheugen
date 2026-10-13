# Existing canonical cron — contact authority review

Date: 2026-10-13. Production SQL migration applied and read back: active `powerhouse-identity-graph-v1`, schedule `2,17,32,47 * * * *`, review call present. Existing job work is preserved. No parallel scheduler, publisher or queue was created.

The new bounded contact authority review runs in four 500-record batches per existing scheduled execution, continuing until every stored enrichment state is reviewed for the business date. Errors are isolated from the identity graph and from the other outbound channels. A manually invoked batch increased verified reviews to 1,000, proving write-through; scheduled execution and full coverage still require future readback. No commercial send occurred as a side effect.
