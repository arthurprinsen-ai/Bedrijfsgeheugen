# Instagram pre-publish business-rule scope — 20 september 2026

Fingerprint: `instagram-prepublish-business-rule-scope-v1`.

## Incident

A production publisher run correctly passed the Instagram winner lineage and media flow, but `bg-pre-publish-review` blocked Mira with the generic `doorklik` rule requiring a measurable `bedrijfsgeheugen.nl/g/...` link.

## Root cause

The generic rule engine ran for every channel except `linkedin_personal`. That made Instagram inherit business-page rules that conflict with the canonical Mira-only daily-life contract.

## Fix

Generic business-rule checks now apply only to `linkedin_company`. Instagram keeps its dedicated fail-closed Mira identity, exact-media, dimensions, provider and final-asset gates.

## Prevention

Regression coverage asserts that the generic RPC cannot be applied to Instagram. Mira content must not be forced to include business CTAs, tracking links or a business moral.

## Terminal proof

Protected merge → exact-main Supabase deployment → Instagram re-review/publisher run → no `doorklik` violation → provider path continues under existing Mira/media gates.
