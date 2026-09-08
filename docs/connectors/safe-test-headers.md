# Safe-test request marker

All external provider safe-test requests must send `x-bg-safe-test: 1` and JSON content. Provider implementations must keep side effects constrained to their safe-test contract.
