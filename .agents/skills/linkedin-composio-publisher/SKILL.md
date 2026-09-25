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

## Terminal delivery

Do not report LIVE or DONE until the chain has:
root cause → protected tests → merge to main → production deployment → production source readback → canonical run → provider-side publication evidence/readback → learning/writeback.
