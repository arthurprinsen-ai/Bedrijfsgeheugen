# Canonical V18 Platform route correction

The first recovery added runtime protection so a visible **Platform** navigation link cannot keep routing to `/bedrijfsgeheugen`.

Production readback then showed the deeper source: the homepage is regenerated from the pinned V18 production payload, and that payload still emitted the historical mobile route.

This follow-up fixes the canonical build projection itself. Before the homepage is written, a mobile anchor labelled **Platform** with the legacy `/bedrijfsgeheugen` target is rewritten to `/product`. The build fails if the expected repair point disappears unexpectedly.

The runtime protection remains as defense in depth, but the generated HTML is now the primary authority.
