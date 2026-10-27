# Powerhouse email and personal social delivery recovery — 2026-10-19

Obligation-ID: `powerhouse-email-and-personal-social-delivery-p0-20261019`
Candidate PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4473

## Verified incident evidence

- `powerhouse_email_provider_preflight_reconcile_v1` required both `account_resolved` and `account_user_resolved`; the authenticated dry-run returned only the former. Preflight was RED even though the Composio/Gmail account was resolved.
- `powerhouse_channel_decisions` showed an Oct 19 LinkedIn company post with provider URN but no Oct 19 personal-post receipt. Personal posts for Oct 17–19 failed `STORY_FAMILY_DUPLICATE` against the Oct 15 canonical claim.
- The content generator repeated the same founder theme (werkinstructies / stale measurement) for five days. Source selection could not rotate after a provably pre-provider uniqueness failure.
- Current CRM: 23,295 contacts; none have explicit `extra.human_approved=true`. No `autonomous_email` actions were prepared or waiting at inspection time. A connected Gmail account does not authorize mass outreach.

## Candidate repair and safety

Gmail dry-run adds actual `Boolean(acct.id)` and `Boolean(acct.userId)` fields. Personal source selection excludes a source already rejected as a semantic duplicate ONLY when the publication capability was unconsumed and no provider-side effect is possible. If no distinct verified source exists, retain a truthful `NO_UNIQUE_VERIFIED_PERSONAL_SOURCE` block. Maintain exactly-one canonical publisher, independent prepublish checks, per-recipient approval and provider readback.

## Regression and release criteria

Historical regression: `tests/brain-canonical-delivery-preflight-personal-dedupe-20261019.test.mjs`. Required CI, CodeQL, protected merge, authorized Supabase Edge deploy and fresh dry-run readback all remain necessary. No automatic recipient authorization, unapproved mass email, duplicate LinkedIn post, or fake live status is permitted. This record is development evidence, not production success.
