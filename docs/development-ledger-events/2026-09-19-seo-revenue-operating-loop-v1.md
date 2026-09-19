# SEO revenue operating loop — 2026-09-19

Fingerprint: `seo|revenue-growth|intent-owner-first|v1`

## Scope

This event records the durable closure path for the 2026-09-19 website SEO/revenue work.

## Changes

- PR #2389: revenue-first SEO opportunity scoring; existing intent owner first; distinct-intent-gap guard for new content.
- PR #2396: consolidated the duplicate `onprijsd` URL into canonical `ongeprijsd`, with index/RSS/sitemap cleanup and permanent redirect.
- PR #2399: added a contextual third inbound link to `/excel-als-crm` from the business-transferability money page.
- Added canonical Brain learning and a dedicated SEO revenue execution skill.

## Incident and root cause

PR #2389 first failed control-plane admission with `DELIVERY_LANE_INVALID`. The PR used the domain label `seo-growth` as `Delivery-Lane`, while the canonical hygiene policy accepts only the enumerated delivery lanes. The repair is metadata-only: use `backend` for the revenue engine and `website` for web-content candidates.

## Prevention

Delivery metadata must use canonical enum values. SEO domain labels belong in scope/obligation semantics, not the control-plane lane field.

Search intent remains single-owner. Existing money-page authority is improved before new content is created. New content requires an unowned distinct intent and a cannibalization check.

## Terminal evidence

At record creation, #2396 and #2399 were merged into main but Netlify production still identified commit `7ad66b4d60487ecd1297289d6d9527c3b1f96598`. Final closure requires one deploy of the latest main containing all three SEO obligations, followed by public readback, then this event can be considered terminal.
