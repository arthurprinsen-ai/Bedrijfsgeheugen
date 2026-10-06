# Social recovery degraded-preparation failover

The same-day social recovery workflow no longer treats a full content-loop transport timeout as permission to skip the canonical publisher.

The full content loop remains the preferred preparation path. If it times out or returns a non-success response, the workflow records that preparation as degraded and still invokes the existing canonical social publisher once per channel with `mode: publish_only`. This does not add a second provider writer and does not weaken identity, capability, uniqueness, pre-publish or provider-readback gates.

The final daily-decision readback remains fail-closed: required publish decisions must end in `published` or `scheduled`.

Sanitized evidence now uses the visible `recovery-artifacts/` directory so GitHub can upload it reliably.
