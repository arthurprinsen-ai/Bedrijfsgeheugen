# Delivery ledger — Gmail preflight and LinkedIn personal semantic recovery

Date: 2026-10-19  
Obligation-ID: powerhouse-email-and-personal-social-delivery-p0-20261019  
Canonical PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4473  
Required CI: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39252240629  
CodeQL: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39252240802

## Provider and decision evidence

Supabase `powerhouse_email_provider_preflight_dispatch_v1(now())` produced `request_id=7910`; `net._http_response` readback returned HTTP 200 and `account_resolved=true`, `prepared=0`, `eligible=0`, `external_outreach_executed=false`. The old dry-run payload omitted the `account_user_resolved` key that the preflight reconciler requires. The bound Composio Gmail identity requires both ID and user ID before a dry-run can succeed.

The `powerhouse_channel_decisions` record for `linkedin_personal` has no publication receipt on October 19; October 17–18 publication obligations repeatedly reject `GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE` pointing to 2026-10-15. The uniqueness gate is correct. The personal recommendation selector ignores existing `rejected_recommendation_ids` and chooses the same verified story source. The October 19 recommendations contain only one eligible personal AI-native source; no distinct alternative may be fabricated.

CRM readback: `bg_connecties` 23,295 total, 605 rows with email, 0 `extra.human_approved=true`. Outbound `autonomous_email` prepared=0 and waiting=0. No recipient permission, sending or delivery was inferred.

## Implementation

Two narrowly scoped Supabase source edits on one GitHub candidate branch: explicit dual account/user preflight readback and fail-closed personal source rotation under the *existing* safe pre-provider duplicate condition. One focused regression test and learning/documentation accompany the source changes. No provider writes were performed by this repair process. The retired unauthenticated Make email adapter was intentionally left disabled.

## State and follow-through

Protected candidate; do not claim production recovery until Required CI, CodeQL, protected merge, authorized canonical Supabase Edge deployment and exact provider/production readbacks all succeed. Without newly verified, content-distinct personal evidence, social holds safely. Without recipient-specific human authorization, outbound email remains blocked by design.
