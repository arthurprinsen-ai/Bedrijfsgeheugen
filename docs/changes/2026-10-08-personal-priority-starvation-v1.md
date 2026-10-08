# Restore commercial channel fairness in the single canonical content loop

## Production root cause
On 2026-10-08 `powerhouse_channel_decisions.linkedin_personal` was repeatedly BLOCKED with `PERSONAL_SOURCE_UNVERIFIED`. Its priority 100 exceeds company priority 99; the orchestrator's `shouldPreserveExisting` did not preserve this stable, truthful boundary, redecided it, and its `limit(1)` generation repeatedly selected the same blocked personal claim. That starved independent company generation. Anthropic credit exhaustion further degraded candidate generation; source-backed Composio/Groq fallback was already deployed, no new AI provider added.

## Recovery in the existing owner
Preserve precisely the same personal BLOCKED obligation while neither a personally verified first-person source nor a verified non-first-person public observation exists. This is NOT a terminal success/skip. When new verified source proof arrives, reopen the SAME obligation automatically. Company and blog can then be selected normally by the next 5-minute owner run, with all global semantic uniqueness, pre-publish, OAuth, exact-ID and provider readback gates intact. No direct social API, second scheduler, competing content generator, auth bypass or forcing of contact.

## Evidence
- Original blocked personal `PERSONAL_SOURCE_UNVERIFIED`; its source recommendation had `build_event_verified=true` but lacked `personal_truth_verified`. Builder event alone is not permission to put arbitrary first-person claims in Arthur's mouth.
- Company `linkedin_company` was `decided` with an independently eligible business content recommendation.
- Existing canonical publisher successfully published company post `urn:li:share:7513894237386719236`, verified via provider, `LIVE_PROVEN` and written back to Brain.
- Fresh negative and positive replay tests enforce starvation avoidance and resumption with newly verified evidence.

## Protected delivery closure
Run same-HEAD Required + CodeQL + official Supabase Preview (where required) → protected merge → deployed Supabase Edge orchestrator version → natural content-loop run showing no personal priority starvation → next independent company/blog proof on a new day where eligible. Before those proofs this improvement is NOT terminal production-proven.
