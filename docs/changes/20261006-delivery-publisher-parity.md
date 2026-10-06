# Publication delivery recovery — 6 October 2026

The delivery path was repaired without reopening scheduler/lease work.

The social publisher no longer runs cockpit/autopilot work during normal publication. The content loop calls the publisher with `publish_only`, while the explicit `cockpit_autopilot` mode remains available separately. Publication evidence from older rows is normalized before use so JSON strings cannot be expanded or repeatedly amplified.

The already-applied SQL repair is documented as production history rather than replayed as a new migration. The blog queue and social publisher source are pinned to the current production implementations.

LinkedIn company publication now reaches the provider-auth preflight and stops safely because none of the existing LinkedIn connections has the required organization-admin scope. The same daily claim remains resumable after a correctly scoped OAuth authorization; no replacement claim or duplicate post is created.
