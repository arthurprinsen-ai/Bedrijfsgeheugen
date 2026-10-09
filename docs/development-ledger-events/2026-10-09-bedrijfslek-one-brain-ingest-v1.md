# 2026-10-09 Bedrijfslek canonical Brain ingest
- Obligation-ID: bedrijfslek-canonical-one-brain-ingest-v1
- Parent-P0: #4198
- Delivery-Lane: backend
- Candidate-Type: implementation
- Base-SHA: 4fd9fb7a9ba7286395ee2b5b0f3f778dd618e8c5
- Fingerprint: powerhouse|bedrijfslek|canonical-one-brain-ingest|v1
- Initial reality: Direct result/quick wins work; canonical Brain scan data for /zelfscan absent.
- Action: Reuse existing scan pipeline, add explicit Bedrijfslek kind/source and privacy-safe browser submission.
- Stable dedupe: one key per scan completion; original store has unique submission_key and runtime event dedupe_key.
- Safety: aggregate-only, no unverified tenant identity projection; existing consent & outbound policies unchanged.
- Live evidence: PENDING, not falsely green.
- Next safe action: protected CI, review, merge, deploy Netlify+Supabase Edge from identical source, perform no-PII readback and verify tenant claim.
- Writer-Lease-State: CANDIDATE_WRITING

- Portal V2: append authenticated scan history and click-to-claim bridge via existing tenant-secured endpoint, no shadow store or auto identity claim.
