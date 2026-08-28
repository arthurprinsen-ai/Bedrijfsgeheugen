# Brain Data Quality Policy

Source health is explicit: `HEALTHY`, `STALE`, `DEGRADED`, `CONTRADICTED`, `UNAVAILABLE`. Unhealthy data may reduce autonomy but may never silently retain full confidence.

Malformed records enter a replayable quarantine lane and are excluded from active decisions. Stale or unavailable sources may use last-known-good snapshots with age-based confidence decay. Contradictions are preserved and classified `CONTESTED`; they trigger research instead of silent overwrite.

Identity resolution is deterministic first. Fuzzy matches are candidates only and never auto-merge. Verified Current State cannot be replaced by lower-authority stale/inferred records.
