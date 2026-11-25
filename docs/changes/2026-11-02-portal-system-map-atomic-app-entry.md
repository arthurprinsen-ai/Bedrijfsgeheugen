# Canonical ONE BRAIN change — atomic Portal map/cache provenance

**Date:** 2026-11-02. **Parent incident:** #4439; original independent BRAIN 41428302145 recorded failed cases #2917 and #3162. **Status:** protected candidate, NOT live and NOT verified recurrence prevention.

## Root cause
Source generator updated canonical System Map but not the immutable version of `./app.js?bg_explain` in Portal V2's HTML. Original CI System Map guard verified only map, not the entry. This produced repeatable browser cache/source drift after unrelated portal changes.

## Minimal original-owner repair
`scripts/brain/portal-explanation-inventory.mjs --write` now stamps exactly one Portal module-entry URL using the same deterministic digest as the existing map, without editing unrelated assets or creating a second renderer. The read-only mode fails when either is stale. The existing protected integrity gate verifies both tracked files, both digests, two deterministic passes and exact integration SHA; dirty generated HTML or Map blocks admission.

## Evidence / safety
New temporary-fixture regression verifies first stamp, unchanged repeat, modified Portal asset, no-write failure and exact matching updated HTML/Map. The existing `powerhouse-netlify-production-truth` skill is updated. Historical, shadow, canary, protected Required/CodeQL/full original BRAIN and independent Netlify exact-SHA/login readback are prerequisites. No direct provider deploy, duplicate writer/scheduler, permissions relaxation, skipped test or manufactured customers/orders.

## No-recurrence / human acceptance
Every future Portal asset or inventory change must regenerate both files and pass protected CI. Only after protected merge + independent provider production proof and a later full BRAIN run can the original ONE BRAIN occurrence be marked PROVEN. Portaal may display structural green separately from business/ROI evidence.
