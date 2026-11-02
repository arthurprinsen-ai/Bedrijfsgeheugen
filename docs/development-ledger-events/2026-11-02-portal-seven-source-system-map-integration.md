# Original release incident — System Map source ownership split

2 November 2026. Parent #4439, source PR #5264. Recorded independent failure: Required #41429624672 `SYSTEM_MAP_INTEGRITY_FAIL` (new hash 3a8bf045...), earlier #41429058792 `SCOPE_CONTAMINATED` when unrelated generated files entered the seven-view test-only candidate.

Owner: original System Map integration. Action: separate protected Portal coverage UI+generated Map+HTML candidate, keep #5264 restricted to original seven-provider read-only regression/ONE BRAIN learning/AGENTS/skill documentation. No extra writer or scheduler. Regression gates: `tests/delivery-system-map-merge-integrity.test.mjs`, seven-view readback test, full original backend, protected Required/CodeQL and independent Netlify provider/live tenant readback. Until proven: CANDIDATE/OPEN; no fake 0, payments or full system green.
