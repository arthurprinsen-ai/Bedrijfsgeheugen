# Powerhouse CI job evidence — executed-only, 2026-10-23

Canonical issue: #4661. Fingerprint: `delivery|predictive-lane-capacity|executed-only-ci-hotspot-evidence|20261023-v1`.

Evidence: GitHub Actions raw job REST API returns completed/skipped placeholders; previous summary accepts all non-null conclusions. GitHub-run observation [39922828795](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39922828795) showed 25 valid *as previously defined* provider records and queue-wait sample p50/p95 3/4 seconds, not an independent executed-only benchmark. At least two other checked provider runs included 0ms skipped placeholders. A read-only spot check of 15 recent runs found 17 timestamp-complete job records, including two skipped zero-duration rows; these 17 alone cannot establish percentiles under the fixed >=20 threshold.

Repair in existing owner scope: reject nonexecuted conclusions and fail-closed under missing data; include up to five exact-run/job/SHA execution hotspots as bounded diagnostics, not speedup/critical-path evidence. Existing Janitor schedule unchanged. Replay test covers zero-duration skipped records, deterministic ordering and provider read failure. No duplicate scheduler, incident, PR owner or unapproved release.

Terminal gate: exact-head protected CI + CodeQL, merge/main readback, existing Janitor natural run + actual execution-only sample; otherwise hold. Issue #4661 OPEN, provider anomaly #4655 OPEN.
