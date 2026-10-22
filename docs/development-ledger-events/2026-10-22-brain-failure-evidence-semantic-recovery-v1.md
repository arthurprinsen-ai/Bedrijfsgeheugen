# Development ledger · 2026-10-22 · Brain incident evidence durability

Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681
Fingerprint: \`brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1\`
Status: CANDIDATE, not live proven. Delivery-Lane: backend.

Observed proof: production \`brain_observe_failure\` executes \`evidence=coalesce(p_evidence,evidence)\`; cron 46 contains 20 raw occurrence records for 11 normalized runs, 20 distinct hash pairs. No historical row deleted and no missing verified proof manufactured.

Root cause: whole-document JSON replacement and literal-only occurrence_id dedupe. Fix candidate: retain registry evidence after promotion; new raw JSON stays in canonical append-only occurrence table; semantic alias parser + advisory per-event lock; old conflicting hashes fail closed. Pure-expression index accelerates identity lookups; no duplicate store. Explicit source guard prevents silent source drift.

Verification obligations: isolated preview transaction ROLLBACK, exact PR-head Required and CodeQL, runtime concurrency and fail-closed conflict tests, security definer owner/search_path/ACL check, protected merge and postrelease provider/database readback. Cron 46 commercial snapshot remains a separate release hold (#4215). Never bypass branch protection or fabricate revenue, customer sessions or green badges.

## Project isolation correction
Different Supabase project IDs with identical job/run IDs must remain different events. Known numeric/job aliases for the SAME project can deduplicate. Legacy projectless events are ambiguous with scoped events and now fail closed in both arrival orders. The previously installed preview index is REINDEXed in a follow-up migration because replacing an IMMUTABLE helper does not recompute existing index values. A negative SQL canary deliberately removes the verified marker and must reject missing proof. Production unchanged until protected release and readback.
