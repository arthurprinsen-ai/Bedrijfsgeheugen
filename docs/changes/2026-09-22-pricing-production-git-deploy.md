# Pricing production deployment recovery

The pricing release is being moved back through the repository-connected production path instead of depending on a temporary MCP proxy credential.

## Cause

The prior production promotion workflow could package the exact source but could not deploy because `NETLIFY_MCP_PROXY_PATH_TEMP` was not present in GitHub Actions.

## Change

PR #2614 makes a real pricing-page delta and canonicalizes pricing-page internal links to full `https://www.bedrijfsgeheugen.nl/...` URLs. This ensures the website lane is evaluated as a normal Git-delivered website change.

## Prevention

A website release may not be called live on merge alone. The terminal condition remains: required gates pass, production deploy completes, `release.json` proves the production identity, and the live pricing page contains the canonical pricing contract.

## Evidence

The same PR carries Brain learning, this human-readable change record, and an append-only development ledger event so the material-writeback closure guard can prove the lineage.
