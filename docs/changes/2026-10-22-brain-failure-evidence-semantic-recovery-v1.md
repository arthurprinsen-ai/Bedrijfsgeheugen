# Brain failure registry: evidence preservation and semantic cron dedup (P0 #4681)

Fingerprint: \`brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1\`.

The existing SECURITY DEFINER \`brain_observe_failure\` previously overwrote promoted evidence with the latest occurrence JSON. The patch preserves the earliest/promoted summary; every new raw observation continues to be saved immutably in the existing \`brain_failure_occurrences\` table. Known cron aliases normalize to a common job/run identity scoped to the physical Supabase database; advisory transaction lock prevents two writers from incrementing one semantic event concurrently. Conflicting fingerprints or hashes fail closed.

The production audit found 20 raw occurrences and 11 distinct runs with 20 different payload hashes. **Do not erase, rewrite or silently coalesce these historic observations.** The new code preserves these rows and flags conflicted aliases rather than inventing a single trusted payload. Non-cron events retain their exact ID contract. No new scheduler or error backend.

Evidence gates: SQL rollback-only preview smoke, executable source regression, exact-head Required and CodeQL, security advisor/ACL readback, protected squash merge, deployed function readback, two actual concurrent writers, and proof the next real cron observations do not lose evidence. This PR does not fix the independent commercial 120-second cron #46 timeout. No production-green claim until verified.

## Project isolation correction
Different Supabase project IDs with identical job/run IDs must remain different events. Known numeric/job aliases for the SAME project can deduplicate. Legacy projectless events are ambiguous with scoped events and now fail closed in both arrival orders. The previously installed preview index is REINDEXed in a follow-up migration because replacing an IMMUTABLE helper does not recompute existing index values. A negative SQL canary deliberately removes the verified marker and must reject missing proof. Production unchanged until protected release and readback.
