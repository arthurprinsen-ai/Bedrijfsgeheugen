# 30 oktober 2026 — Canonical CMS publication evidence for portal

## Observed authoritative state
The original Supabase `public.cms_content_items` contains six items, all `draft`, all last updated on 2 October 2026. One portal navigation item, three shared brand/contact items and two website/SEO items. None are published; `published_at` is null for all. No dedicated strategic-adviser CMS element exists, and the CMS schema has no separate software-release `approved` state.

This does **not** invalidate the independently LIVE_VERIFIED protected Portal V2 release `d53eea34c0b0d0bfdb2c440dd823e9244df6ae41` with Netlify production deploy `6ae4f3aa2aaf83a234399e47`. CMS governs authored text/overlays; GitHub/Required/CodeQL/Netlify/browser-readback govern software delivery. A green deploy cannot fabricate editorial publication, and a `published` CMS item cannot approve code.

## Root cause and remediation
Fingerprint `cms|portal|software-release-vs-editorial-status-confused|20261030-v1`. Previously `/cms.html` showed item-level pills but no authoritative all-items review summary; users could mistake a live production release for separately approved CMS content. The original admin interface now computes a purely read-only summary from its existing authenticated `GET /api/cms-admin` and `generatedAt` response using `assets/cms-review-contract.mjs`. Counts separately identify draft/published/archived and portal+shared scope. Missing/invalid readback is `UNAVAILABLE`, never fake zero or green. A static notice explicitly states CMS publication != software-release approval.

## Ownership and proof
CMS admin publishes individual content **only by existing authorized action**. Do not auto-publish the six old bootstrap drafts, bypass Netlify Identity admin-role proof, write to database or duplicate schedulers/routers. In `portal-state-eu`, `cms_public` continues to return only published items. CMS revisions, attribution and provider readback stay in original tables. Docs, main agent guidance, Company Intelligence OS skill, Brain candidate and regression live in the same protected PR.

Proof: `tests/brain-cms-portal-release-assurance-20261030.test.mjs` and existing `tests/cms-website-portal-v1.test.mjs`. Promote technical acceptance only after protected CI, exact merge SHA, Netlify publish and browser/tenant readback; editorial approval stays pending until authenticated authorized CMS publication + independent public-readback of the corresponding item. No fabricated commercial uplift.
