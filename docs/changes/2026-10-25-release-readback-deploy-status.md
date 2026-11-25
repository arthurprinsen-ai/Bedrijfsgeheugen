# Deployment applicability evidence in production readback

The canonical classifier exists on main following PR #4947, but the existing Production Release Readback workflow did not consume its status.

This change imports the canonical classifier and emits `deployment_status` as a job output, plus a log line. Governance-only changes become `NOT_REQUIRED` rather than erroneous failed-deployment reports. Runtime changes without independent provider evidence remain `UNKNOWN`, not LIVE. Existing browser, provider, Required and CodeQL gates remain unchanged.

This is CI observability integration, **not a website dashboard UI change**. Protected merge and real run evidence are required before claiming operational adoption.
