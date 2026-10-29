# Read-only live authorization matrix for the existing blog exporter

The existing canonical GitHub blog workflow gains an optional `workflow_dispatch` input `security_probe_only`. The established publishing job is skipped entirely when this boolean is true. A separate **job in the same workflow** performs strictly read-only HTTP GET checks: anonymous 401, unapproved 403, historically published without last-mile approval 403, and approved/published 200. No blog content, HTTP body or secret value is written to logs. No new workflow, schedule, writer, pull request or publisher is created by executing the probe.

This is a security test facility only. The existing scheduled publisher and its publication authority remain unchanged. The canonical P0 incident remains OPEN until the actual live matrix and historical disclosure assessment are complete.
