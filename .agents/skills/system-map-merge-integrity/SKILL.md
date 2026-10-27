# System Map single-writer merge integrity

## Mandatory preflight
Read AGENTS.md, the canonical delivery obligation and owner lease before writing. This skill applies to any new or changed GitHub Actions workflow, delivery orchestration, System Map generator, release gate or status check. Reuse the existing Repository Janitor and merge queue; do not introduce a second scheduler, workflow writer or release owner.

## Atomic integration
1. The integration owner owns the source change, generated System Map, required test evidence and the candidate head as **one obligation**. Competing agents may inspect but must not write that head.
2. Generate the System Map from the **exact integrated tree**, never from a stale feature branch or a different main epoch. Regeneration must be deterministic; two runs against the same tree produce identical bytes. Exclude volatile time/run IDs.
3. Regenerate **before** the final validation, commit source and generated output together, and then freeze the candidate head for terminal delivery. On base/head drift, invalidate the evidence and re-evaluate on the new integration tree through the existing owner.
4. Merge queue must validate the synthetic `merge_group` SHA; ordinary `pull_request` checks do not substitute for it. Required, BRAIN and CodeQL must each conclude successfully for that same exact SHA. Checks absent, skipped, stale or on another SHA are **not green**.
5. Use the existing protected merge queue and ruleset; do not self-merge directly or weaken security/branch protection. Verify exact main merge lineage, Netlify deployment commit and independent production readback before closing the obligation.

## Automated drift guard
Run `node tools/delivery/assert-system-map-integrity.mjs` in the **existing** Required/BRAIN release checks after checkout of the exact SHA and before releasing. Supply the repository's existing deterministic regeneration command in `SYSTEM_MAP_GENERATE_COMMAND` and the tracked generated map path in `SYSTEM_MAP_PATH`. The guard fails closed if either is absent, the generator fails, two regenerations differ or regeneration changes the tracked map. Do not use shell wrappers or unreviewed inputs for these values. Allow only the canonical integration writer to update the generated map.

## Agents and learning
On drift, upsert fingerprint `delivery|system-map|integrated-tree-drift|v1` in the existing Brain obligation; attach candidate SHA, merge_group SHA, generator exit status, tracked-path diff, Required/BRAIN/CodeQL statuses and precise next action. The existing Janitor may detect and resume, but must not create competing PRs or silently overwrite another writer. Skill acceptance requires exact-SHA green gates, protected merge and independent production verification; editing this skill does not itself prove a deployment.
