# Development ledger — P0 #4198 expired LinkedIn company publication lease

- **Date:** 2026-10-11. **Authority:** existing `powerhouse-social-publisher`; no new scheduler/sender.
- **Observed failure:** `DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED`, three expired company leases, none consumed, one unrevoked; no provider acknowledgement/ID. Personal LinkedIn has separate acknowledged URN and must not be resent.
- **One-time production repair:** 1 expired unconsumed capability revoked and 1 original company `blocked` claim changed to `content_ready`. No external publication asserted.
- **Candidate:** in-place fail-closed no-side-effect eligibility predicate and guarded lease/decision compare-and-set recovery; no approval, dedupe or provider gates bypassed.
- **Tests:** `tests/brain-social-publish-claim-recovery-p0-4198.test.mjs` covers original-claim success and dangerous non-retry states.
- **Proof path:** protected Required and CodeQL, Supabase source/deploy readback, newly triggered company lane, external provider receipt, public/live URL readback and Brain learning lineage. P0 #4198 remains open until independent multi-channel outcomes are verified.
