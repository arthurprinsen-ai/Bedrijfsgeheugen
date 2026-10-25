# System Map single-writer merge integrity — implementation record

## Incident and cause
PR #4934 adds a guard against missing or non-deterministic System Map regeneration. Required admission surfaced missing structured PR metadata and an unclassified test path; after both fixes, required closure identified absent learning, activity ledger and human documentation. These are compliance and integration failures, not evidence of a completed release.

## Resolution design
Reuse the existing integration owner and `scripts/brain/portal-explanation-inventory.mjs` as an inventory-regeneration candidate; validate its suitability before connecting the guard. Require clean generation from the exact integrated tree, deterministic output, same-SHA Required/BRAIN/CodeQL and protected merge. Do not create competing writes or bypass rulesets.

## Evidence and limits
Required: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40223051109 (failed on closure); CodeQL: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40223051122 (succeeded on prior head). Neither verifies a release for any successor SHA. Production readback remains outstanding.
