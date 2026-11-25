# Prevent expired deadlines becoming commercial posts — P0 #4198

The production content selector chose the source on trust alone: an RVO Circular Plastics NL call already closed on 6 October 2026, even though today's production date is 10 October. The generated company LinkedIn and blog copy invited late applicants and the LinkedIn publication was correctly blocked for duplicating a previous CPNL story. This was a *source selection* error, not an authorization to bypass the post dedupe guard.

This migration adds a narrow predicate to the existing `powerhouse_materialize_source_backed_channel_candidates_v1`: `deadline IS NULL OR deadline >= p_date`. No source is deleted, no new publisher, scheduler or CRM. Valid alternatives are selected by the existing confidence and relevance ranking and the existing prepublish/identity/source/uniqueness gates still apply.

The exact migration was applied to production through Supabase and returned success. Publishing today's content still requires re-generation, unique copy and independent provider readback; this migration alone does not close P0 #4198.
