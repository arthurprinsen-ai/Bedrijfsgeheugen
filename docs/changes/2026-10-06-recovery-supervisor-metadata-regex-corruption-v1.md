# Recovery supervisor metadata-regex corruption fix — 2026-10-06

The same-lineage recovery change accidentally embedded almost an entire duplicate recovery workflow inside the JavaScript regular expression that updates PR machine metadata.

The supervisor is restored to a single YAML workflow. The metadata updater now matches only one complete metadata line at a time: `Base-SHA`, `Writer-Lease-Head` and `Writer-Lease-Main-Epoch`. The recovery controller, queue-storm guard, stale-run cleanup and single-lineage refresh behavior are otherwise preserved.

A regression test fails if the workflow header or `jobs:` block appears more than once, or if workflow YAML is ever embedded in the metadata regular expression again.
