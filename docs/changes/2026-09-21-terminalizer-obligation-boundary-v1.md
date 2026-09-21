# Terminalizer obligation boundary

The obligation terminalizer now stops supersession traversal when a historical predecessor belongs to a different `Obligation-ID`. This preserves same-obligation migration verification while preventing unrelated historical obligations from blocking an already-proven production release.


The recovery now pins `tests/brain-terminal-obligation-boundary.test.mjs` as the historical replay required by learning canonicalization.


Existing Supabase terminal-readback and supersession-migration contract tests now assert `SUPERSEDES_OBLIGATION_BOUNDARY`, keeping the historical safety suite aligned with the corrected lineage semantics.
