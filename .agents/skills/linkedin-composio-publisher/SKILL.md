---
name: linkedin-composio-publisher
description: Enforce Composio as the canonical LinkedIn publication transport and keep generation fallbacks separated from publication authority.
---

# LinkedIn — Composio publication authority

Fingerprint: `linkedin-composio-chain-provider-isolation-v1`.

## Hard transport rule

LinkedIn personal and LinkedIn company publication must use the canonical Powerhouse publication authority and Composio transport. Buffer is not an allowed LinkedIn fallback, reconciliation authority, retry transport or replacement writer.

A Buffer outage, HTTP 429, missing Buffer token or failed legacy Buffer sync must never block or downgrade LinkedIn publication. Buffer compatibility work is non-blocking telemetry only.

## Single-writer and duplicate prevention

Before any LinkedIn side effect:
- resolve the exact channel identity and capability;
- reserve/use the canonical daily publication claim;
- keep at most one writer for each channel + publication date;
- if provider truth is uncertain, fail closed;
- never issue a replacement post merely because readback is unavailable;
- after a successful write, retain the exact provider post URN/ID and perform exact readback where supported.

Any existing claim with `republish_forbidden=true`, `possible_provider_side_effect=true`, or `provider_create_success=true` plus an exact `delivery_ref` is terminal for create semantics: it may be reconciled, but never re-decided or re-created.

Fingerprint: `linkedin-republish-forbidden-preservation-v1`.

## Personal versus company identity

Personal LinkedIn remains subject to the `personal-linkedin-personal-life-only-v1` skill and its verified personal-source gate. Company LinkedIn must never reuse personal diary or household content as company copy.

Company-page publishing capability must be proven separately from personal-member capability. Missing LinkedIn organization permissions is a hard boundary, never a reason to route through Buffer.

## Generation fallback is not publication fallback

Content generation may use the separately governed `supabase-bg-composio-content-fallback-v1` route only when the primary generation provider is unavailable because of explicit provider-availability failures such as:
- credit exhaustion;
- missing primary API key;
- HTTP 401, 403 or 429;
- provider HTTP 5xx.

Ordinary request/schema/programming errors do not authorize fallback.

The Composio/Groq fallback may create only the canonical six-field artifact:
`title`, `body`, `cta`, `hook_type`, `focus_keyword`, `meta_description`.

It may never publish directly. All downstream personal-truth, company-tracking, identity, dedupe, publication-authority and exact LinkedIn URN-readback gates remain mandatory.

## Personal create/readback split

A successful personal LinkedIn create response is a provider side effect even when the subsequent LinkedIn readback endpoint is forbidden or unavailable. Once Composio returns a post URN:
- persist that exact URN immediately in the canonical claim and obligation lineage;
- record create success separately from readback truth;
- use verification-pending/dispatched state when exact readback is unavailable;
- set `republish_forbidden=true`;
- reconcile only that exact URN later;
- never erase the URN and never create a replacement post for the same daily claim.

Fingerprint: `linkedin-personal-created-urn-preservation-v1`.

## Production evidence contract

A LinkedIn lane may only be reported as `LIVE_PROVEN` when provider-side truth has been verified for the exact post identifier. A successful create response without exact readback is `DISPATCHED` / `verification_pending`, never `LIVE_PROVEN`.

For ambiguous historical claims where legacy code lost the created URN, preserve the claim with `possible_provider_side_effect=true` and `republish_forbidden=true`; do not retry.

## Powerhouse system contract

This policy is canonical Powerhouse behavior, not a local publishing workaround. Agents, chats, schedulers, recovery flows and future social integrations must:
- consult the canonical publication claim before every side effect;
- preserve provider-side-effect evidence across retries and failures;
- separate artifact-generation fallbacks from publication authority;
- fail closed on ambiguous provider truth;
- write root cause, prevention, tests, documentation and ledger evidence in the same delivery lineage;
- never declare DONE/LIVE before protected CI, merge, production deploy, source readback and provider truth evidence.

## Terminal delivery

Do not report LIVE or DONE until the chain has:
root cause → protected tests → merge to main → production deployment → production source readback → canonical run → provider-side publication evidence/readback → learning/writeback.
