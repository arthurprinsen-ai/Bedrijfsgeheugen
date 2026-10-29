# Preserve valid LinkedIn source evidence without weakening the story gate

Some date-scoped personal-source recommendations store JSONB evidence as a JSON string. This change unwraps only well-formed JSON objects when the existing orchestrator reads them, before the same editorial, identity, provenance and story-uniqueness gates. Malformed or scalar values are rejected as before. No external publisher, scheduler, historical duplicate protection or content approval mechanism is changed.

A successful software release is not proof of a new post: a genuinely different verified story must still be selected and pass the canonical review before official LinkedIn provider ID and readback can close the original obligation.
