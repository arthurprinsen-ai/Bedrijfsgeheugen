# Personal LinkedIn source dedupe — current-main recovery

Production already excludes previously used personal LinkedIn fallback content IDs, but canonical Git did not contain that hotfix. This recovery adds an idempotent migration: it no-ops when the exact production invariant is present, patches the known pre-fix function shape on replay, and fails closed on unknown drift.
