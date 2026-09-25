# Connector response-shape resilience

## Incident

On 2026-09-25 a bundled GitHub write stopped before writing to the branch. The create-tree response did not expose the tree SHA in the field the caller expected.

That is a connector schema/envelope compatibility defect, not a repository-content defect.

## Permanent operating rule

All chained connector mutations must separate **semantic identity** from **transport shape**.

The caller first normalizes the response into canonical values such as `sha`, `commit_sha`, `id`, `ref`, `url`, and `status`. Only after the required identifier has been proven may the next mutating step execute.

Missing required identity means fail-before-mutation.

## GitHub write fallback

The preferred fast path may use Git data/tree APIs when the connector contract is proven. If the returned tree SHA cannot be normalized safely, the agent must stay on the same branch and obligation and use branch-safe Contents API writes (`create_file` / `update_file`) instead.

This fallback is deliberately slower but removes dependence on an ambiguous intermediate tree payload. It must not create a second recovery PR and must not replay already-proven writes.

## Required evidence

For every connector mutation chain:
- preflight the current tool contract when exposed;
- validate returned semantic identifiers;
- preserve raw response-shape evidence without secrets on mismatch;
- read back branch/commit/provider state after mutation;
- write the incident fingerprint into Brain learning and the development ledger;
- project durable prevention into the relevant agent skill.

Canonical fingerprint: `connector|response-shape|normalize-before-use|v1`.
