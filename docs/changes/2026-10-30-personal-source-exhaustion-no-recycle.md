# Personal LinkedIn: stop stale family fallback on source exhaustion — 2026-10-30

**Original authority:** ONE BRAIN / Powerhouse daily content-orchestrator and existing original social publisher. **Existing incident:** #4439. No parallel content agent, writer, scheduler or truth store.

## Verified production problem
The existing canonical personal LinkedIn obligation for 2026-10-30 was BLOCKED with `GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE`, no provider ID and no independently verified live post. The prior 27 October story family rejected the generic candidate. A second existing 30 October candidate was rejected against the 29 October family. The original obligation's `rejected_recommendation_ids` retained both candidates. The owner orchestrator had already selected a third candidate, but that is not yet independent evidence of a distinct story or successful publication.

The exact source bug is in original `supabase/functions/powerhouse-content-orchestrator/index.ts`: after using `isStalePersonalSource` with prior published event-type families, it did `|| eligiblePersonal[0]` when all eligible source events were already used. That fallback negated the fresh-family check. Rephrasing the generic founder chapter cannot correct the root cause.

## Protected change within the EXISTING system
- Remove the stale `eligiblePersonal[0]` fallback: only candidates with canonical verified source evidence, not in original rejected IDs, and not in recent event families may be chosen. With no fresh verified source, fail closed and continue the other existing channels and original scheduled source acquisition. Do not add DataForSEO calls outside the existing radar budget.
- Add live regression against the original exported `isStalePersonalSource` function and static guard that the first-candidate fallback never returns.
- Existing admin-only Portal V2 now gives plain Dutch recovery instructions for existing public-safe `NEW_FACT_VERIFIED_DISTINCT_STORY_REQUIRED` and `FRESH_INDEPENDENT_PERSONAL_SOURCE_REQUIRED` codes. It does NOT expose original reservation/body, raw provider IDs or tokens and never marks BLOCKED green.
- Update original social-recovery and self-improvement agent skills, ONE BRAIN public-safe OBSERVED fingerprint and this human-readable source document/append-only developer ledger.

## Security/authorization and proof gates
Preserve original identity, editorial, consent, protected token, semantic uniqueness/fingerprint, publisher and provider proof gates unchanged; existing 29 October personal provider-created post stays NO_REPOST and provider GET forbidden is not live verification. Existing cron #116/#130/#171 remain enabled; existing Composio owner OAuth must be granted by owner when required, never bypassed.

**Distinct separate milestones:** (1) protected GitHub exact-head Required/BRAIN/CodeQL/System Map merge, (2) Netlify exact-SHA production/admin tenant browser for the original portal, (3) original Supabase **Edge** function deployed and read back at the protected source revision, (4) next original natural agent selection and durable error-fingerprint/lesson application record, (5) provider create-ID and independent live outcome. Steps 1–3 do not imply 4–5. Keep UNKNOWN/OBSERVED until evidence exists.
