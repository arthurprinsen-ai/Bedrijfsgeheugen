# 18 November 2026 — correct current final-review receipts in existing original social publisher

Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 .

Following protected original personal 422 reviewer recovery PR #6045 and one original #140 tick, the 18-Nov personal post was actually created via the original authorised Composio LinkedIn writer: `urn:li:share:7528898612878278657`, native status PUBLISHED then LIVE_PROVEN through public LinkedIn page. No resend is permitted, and the consumed publication capability is authoritative. The provider-specific exact text GET_POST_CONTENT returned Forbidden, so independent complete text readback remains unverified.

**New evidence conflict:** Original publisher composed gatePassedEvidence using previous row.delivery_evidence, wrote pre_publish_gate='passed' and current final_text_hash, but carried prior review_status=422 / violations and prior reviewed_text_hash even though a NEW exact independent HTTP200 PASS gate was required by code to proceed. The publisher must not mark the current record simultaneously approved and still rejected.

**Fix without bypass:** Immediately after its own exact gate.http===200 && can_publish===true && identity PASS && exact SHA check, original publisher sets current review_status=gate.http, reviewed_text_hash=textHash, violations=[], review_transport_error=null, and independent_final_review_verified=true with timestamp. A bounded history object stores superseded previous 422 code/hash/violations as prior_rejected_review for audit. No altered provider gate, no direct resend, no new cron/agent/secret, no fabricated LinkedIn text readback.

**Release proof:** protected exact-head Required+CodeQL, canonical main, actual original powerhouse-social-publisher Edge source/version readback. Natural subsequent original review success must store consistent 200/hash/empty errors, and future independent provider exact author/text readback required for completeness. Today's existing published row must NOT be directly reset, republished or incorrectly rewritten as independently fully text-proven; preserve its historical conflict in original incident and analysis.
