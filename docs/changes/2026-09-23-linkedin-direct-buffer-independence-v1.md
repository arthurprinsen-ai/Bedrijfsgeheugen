# LinkedIn direct transport — Buffer independence v1

Date: 23 September 2026  
Fingerprint: `linkedin-direct-buffer-independence-v1`

## Root cause

Personal LinkedIn publishing was incorrectly coupled to Buffer for both creation and provider readback. A Buffer HTTP 429 therefore became a hard blocker for the daily personal LinkedIn obligation. Separately, LinkedIn's author-feed finder returned HTTP 403 for the connected application; retrying cannot repair a missing API permission.

## Structural fix

`linkedin_personal` now uses the authenticated Composio/LinkedIn connection directly. The create response's LinkedIn post URN becomes the canonical `delivery_ref`. Production truth is verified by reading that exact URN using `LINKEDIN_GET_POST_CONTENT`, not by listing the member feed.

The existing atomic decision claim and publication capability remain the single-writer/idempotency authority. If exact LinkedIn readback is uncertain, the channel fails closed and **must not** create a replacement via Buffer.

Buffer circuit state can still isolate Buffer-dependent channels, currently including `linkedin_company`, but no longer gates `linkedin_personal`.

## Prevention invariant

A provider rate-limit on an optional transport must never block a channel that has a healthy direct transport. A successful write must retain its provider identifier and verification must target that exact identifier. Unknown provider truth never authorizes a second write.

## Verification

The backend regression suite now asserts that an open Buffer circuit does not block personal LinkedIn, that direct LinkedIn create/readback calls are present, and that the old two-LinkedIn-channel Buffer gate cannot return.
