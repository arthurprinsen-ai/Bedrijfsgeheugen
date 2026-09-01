# Make transfer governor test notes

The first PR run is intentionally expected to fail because `tests/make-cost-governor-policy.test.mjs` imports `tools/make-cost-governor-policy.mjs`, which does not exist yet. That RED proves the required check executes the new policy tests before implementation.
