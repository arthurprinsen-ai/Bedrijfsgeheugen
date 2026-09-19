# Regulatory source-observation writeback guard

Canonical regulatory source observations no longer need an implementation-style learning/documentation bundle when all of the following are true:

- PR metadata contains `Regulatory-Candidate-Type: source-observation`;
- the sole material changed path is exactly `data/regulatory-source-state.json`.

Every other material candidate remains fail-closed under the existing closure-artifact contract.

The PR body is passed through the workflow and parsed in Node rather than embedding a YAML-significant `: ` metadata literal inside an unquoted Actions expression.
