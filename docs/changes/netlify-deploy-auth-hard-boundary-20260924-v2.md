# Netlify deploy-auth hard boundary — 24 September 2026

## Observed state

Current main `1b49aa2b9c5acbb1d10138b4c07e92585193d0d1` produced exact production artifact `10803924073`, but Production Source Snapshot run `35991169738` failed at the Netlify transport step with `401 Unauthorized`.

The same failure class had already occurred on the prior production lineage. This proves a repeated deployment-authentication incident rather than a pricing/i18n application defect.

## Recovery attempted

- preserved the exact current-main production artifact;
- obtained a fresh transient deploy authorization from the connected Netlify account;
- attempted exact-artifact direct deployment outside GitHub Actions;
- the execution runtime could not complete provider communication, so no new Netlify deploy was registered;
- no credential was persisted in repository content, workflow inputs, logs or documentation.

## Permanent rule

After one confirmed Netlify 401 on the current credential, do not loop the same stale deployment transport and do not change application code. Rotate/re-authorize the deployment credential through the account-level Netlify/GitHub connection, then rerun the canonical Production Source Snapshot.

Terminal proof still requires:
1. exact production `release.json` SHA;
2. pricing toggle/browser interaction proof;
3. English route/browser proof;
4. learning/ledger/skill readback.

Until those pass, status is `BLOCKED_HARD_BOUNDARY`, not `LIVE_BEWEZEN`.
