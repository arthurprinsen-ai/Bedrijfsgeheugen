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

Core SEO delivery is production-proven at main commit `1a8169c82dbbe2238e62a4f91de8600db193903e`.

Netlify production deploy:
- deploy ID: `6aae87a3977cfc000881553f`
- state: `ready`
- commit_ref: `1a8169c82dbbe2238e62a4f91de8600db193903e`
- published_at: `2026-09-19T13:03:42.737Z`
- redirect rules processed: 90, without provider-reported errors
- secret scan matches: 0

Main readback on the same lineage confirms:
- `onprijsd-probleem-bedrijfsvoering` is absent from sitemap, blog index and RSS;
- the permanent redirect to the canonical `ongeprijsd` URL is present in `_redirects`;
- the contextual `/excel-als-crm` link is present on `bedrijf-overdraagbaar-maken.html`;
- the revenue-first content policy, commercial opportunity engine and regression test are present on main.

The external web index reader still returned cached HTML for some pages immediately after the deploy, while the isolated container could not resolve public DNS. That observation is retained as cache/readback provenance and is not substituted for provider deployment identity.
