# Writer material writeback closure compatibility v1

- Date: 2026-09-19
- Obligation-ID: writer-material-writeback-closure-compat-v1
- Incident: PR #2225 could not satisfy both writer-path policy and mandatory writeback closure simultaneously.
- Fix: globally permit only canonical closure-artifact path families in writer candidates while preserving writer-specific business-path restrictions.
- Regression: closure artifacts accepted; arbitrary workflow path still rejected.
