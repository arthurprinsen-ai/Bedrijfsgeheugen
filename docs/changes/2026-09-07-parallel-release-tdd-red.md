# TDD RED checkpoint

The first retained regression tests for change-scoped required release lanes were added before production implementation. They import `deriveRequiredTestSuites` and require lane-aware `Required test` workflow conditions that do not yet exist at this checkpoint, so the new tests are expected to fail until the implementation lands.
