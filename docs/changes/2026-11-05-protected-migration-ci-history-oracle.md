# Correct stale BRAIN checkout oracle after protected migration release

The inherited BRAIN test prohibited `fetch-depth: 0` globally, while original PR #5453 required one preflight checkout with complete immutable base history. The outdated test caused exact-head BRAIN run #42055116770 and terminal closure of protected PR #5450 to fail. Source repair changes only the test oracle, requiring exactly one full-history checkout, original candidate-base validation, and original protected migration admission script. All website/Netlify and remaining control-plane tests are preserved. Production has 808 applied migrations; protected #5462 separately reconciled the immutable source lock. No production migration or SQL history was changed. Full exact-head BRAIN replay and protected merge remain required.

Related: #4198, #3742, #5450, #5453, #5462. Fingerprint: `ci|brain-replay|migration-admission-full-history-vs-legacy-shallow-test|20261105-v1`.
