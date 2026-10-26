# Exact daily blog production proof closes the existing obligation

The existing hourly `Powerhouse daily blog from Supabase` workflow now includes a final, same-date *observation-and-closure* step. It never generates another post or schedules another job.

For a candidate it checks the **only merged branch matching the Europe/Amsterdam business date**, verifies the protected merge is an ancestor of the current production release SHA, checks the release provider is BG169 production, reads the canonical Supabase blog obligation, fetches the exact public blog HTML, and requires matching canonical link, content ID and page title. Only after all evidence passes does it call the existing Supabase `record_content_publication_state` RPC and canonical channel reconciler. The script then independently reads back the terminal state.

A publish candidate is never a public page by assumption. Missing credentials, stale or diverged production release, provider error, mismatched canonical, or a static-homepage fallback leave the obligation open and fail the attempted recovery. Existing security boundaries, protected merges and real visitor outcome instrumentation remain unchanged.

This also preserves the distinction between LIVE_PROVEN *website deployment* and MEASURED / LEARNED commercial outcomes. No synthetic visits, leads, likes, orders or revenue are generated.
