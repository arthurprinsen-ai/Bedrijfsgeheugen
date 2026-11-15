# Development ledger — original #116 zero-due dispatch starved valid source recovery

- **Fingerprint:** `powerhouse|commercial116|wrapped-serp-retry-starved-by-zero-pending-dispatch|20261115-v1`
- **Owner:** original #116 existing commercial source dispatcher and existing public research Edge, existing commercial recipient; existing ONE BRAIN/Heartbeat
- **Root cause:** original Supabase Edge v63 source recovery was live, but the original dispatcher falsely returned NO_DUE_ORIGINAL_SOURCE_RESEARCH because source research had been incorrectly marked done; no existing pending action was due, and original first-party daily source quota was exhausted
- **Native evidence:** original source `1be12b8f-8d43-42e1-b0da-d8ce20291ee4` done; tracking `google.com/goto`; still-held original recipient `e5047182-405c-43f2-8c25-7674f1a2cb70` prepared; previous `relationship_public_research_evidence` event `05618504-b072-4c35-ade3-d365bdfd70fe` falsely VERIFIED; existing source retry backlog 10; exactly one native safely matched wrapper
- **Corrective change:** original same `powerhouse_dispatch_relationship_public_research_v1` gated wake on exact, still-held, no-send, no-ambiguous-provider wrapped-source tuple; unchanged scheduler, original signed token, provider and Edge
- **Historical source quality correction:** same existing Edge quarantines the exact old false-VERIFIED event before retry; preserves event identity, original timestamp and audit, adds corrected fact and original CAS; no fabricated verified page
- **Consumer handoff:** original source action restored to 24-hour waiting; original recipient receives no-source status on same lineage; original commercial review BRAIN remains BLOCKED until lawful verification
- **Regression:** `tests/brain-original-116-wrapped-source-dispatch-wakeup-20261115.test.mjs`
- **Acceptance:** protected CI/CodeQL/Supabase Preview/merge, native Edge/SQL readback, original source/event/consumer readback, zero sends, no duplicate; record where any native step fails
- **State:** PROTECTED_CANDIDATE_NOT_YET_PROVIDER_VERIFIED

- **Protected merge refused:** earlier exact-head Required and CodeQL and native 868 Preview all passed, but unrelated original protected main changed during checks. GitHub returned HTTP 405 "3 of 3 required status checks are expected" and did NOT merge. Same PR #5852 reconciled by exact-head lease to latest main; no parallel PR, direct production SQL or bypass. New exact-head CI and provider Preview required.
