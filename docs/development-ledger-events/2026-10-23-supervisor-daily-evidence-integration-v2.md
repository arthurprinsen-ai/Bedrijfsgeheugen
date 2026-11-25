# Append-only: Supervisor single-owner daily evidence v2

- Canonical origin: #4793 protected merged (\`4d3ea9335c8e0e5449c116e2440e558509cc2697\`); #4792 closed unmerged, preserved as regression source.
- Existing Supervisor owner: #4791 protected merged on main. No second scheduler or branch writer created.
- Concurrency hold: #4795 and #4797 moved to Draft with explanatory comments; neither candidate has been merged or deployed.
- Newly preserved replay: timestamped \`MAIN_DRIFT_RECOVERY\`, exact missing writer lease, echoed shell commands excluded, incomplete logs nullable.
- Daily artifact: derived *within* the existing Janitor run, from its existing supervisor and CI evidence; no extra GitHub API calls.
- Declared path collision is only metadata evidence; native exact-head CAS, protected Required/CodeQL and independent deployments remain non-negotiable.
- Release speedup and avoided CI retries: UNKNOWN until comparable real provider cohorts and independent regressions exist.
- Final acceptance still pending: candidate exact-head CI, CodeQL, protected merge, actual main source readback, scheduled Janitor artifact, independent production verification.
