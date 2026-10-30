# Canonical CMS → Powerhouse → ONE BRAIN → Heartbeat, 30 October 2026

## Executive decision and original authority
The existing Bedrijfsgeheugen CMS is the operational **content authority**, not an independent marketing publisher or approval authority for source-code releases. It owns the editorial states and revisions in `public.cms_content_items` and `public.cms_content_revisions`, the authorized `/api/cms-admin` and read-only `/api/cms-public` pathways, and the existing `/cms.html` UI. Protected GitHub→Netlify→independent browser proof remains the **software release authority**. ONE BRAIN/Heartbeat remain the **learning and runtime evidence authorities**. No new databases, schedulers, trackers, publishers or agents were created.

**Observed baseline on 2026-10-30**: six CMS bootstrap items, six draft, zero published, no independent CMS item live readback or commercial uplift. This is not a defect in the already verified live Portal V2 code release.

## Root cause and failure fingerprint
`cms|powerhouse|editorial-publication-quality-outcome-disconnected|20261030-v1`

Before this change the CMS could save/publish arbitrarily structured content via an authenticated path without a deterministic server prepublication check and without linking the result to the original Powerhouse evidence language. The prior CMS summary only counted statuses, and code release had been confused with editorial approval.

## What the CMS must do in ONE original closed loop
1. **Plan and author** website/portal/shared content with locale, route, stable element key, content type, version and owner. The original CMS remains the sole authority.
2. **Assess quality** using `assets/cms-quality-gate.mjs`: schema, non-empty content, route/URL safety, active HTML restrictions, image alt text, CTA specificity, SEO text length and long editorial claims without references. A warning is advisory, a blocking finding rejects publication. The result is machine-verifiable; human editorial permission is still mandatory.
3. **Approve and publish** through the original Netlify Identity administrator API, only a saved draft and matching expected revision version. A stale browser or an invalid draft is not published. The existing Supabase edge writer persists the item and its versioned revision.
4. **Read back** directly through the existing authenticated gateway's `cms_public` projection; assert exact item ID and resulting version. An unavailable projection must display `PUBLIC_PROJECTION_EVIDENCE_DUE` instead of claimed external live proof. Never blindly retry a committed write.
5. **Deliver and attribute**: only original website/portal CMS runtime applies content. Routes and stable element keys are source lineage; GA4/SEO/CTA attribution must be collected by existing canonical Growth/CRO collectors. An in-memory readiness projection is **not** evidence of website sessions or any order.
6. **Measure** through existing Heartbeat/Growth owner, not a new CMS cron: eligible evidence is actual impressions, website sessions, CTA events, opt-in leads and independently provider-verified payments linked to source/ref, segment and time window. Missing attribution stays `EVIDENCE_DUE`.
7. **Learn**: ONE BRAIN may promote a rule only after verified comparable outcomes, causal or controlled experimental evidence where claimed, and repeat-run regression. Source code/skills/human docs/portal mirror the same incident, not a parallel brain.
8. **Optimize** through original SEO, social and CRO agents: test CTA language, destination, meta descriptions, timing and creative only within consent, duplicate-gates, ID/lineage and original experiment controls. Never auto-publish customer-visible content without authorized editorial approval.

## Implemented scope
- `assets/cms-quality-gate.mjs`: pure deterministic content assessment and 8-stage CMS → Powerhouse projection. Content QA can be ready but no income/learning statuses are created without independent proof.
- `netlify/functions/cms-admin.mjs`: original Netlify Identity admin route; GET adds an authenticated-only derived QA/Heartbeat projection without a second database query. Publishing first re-reads the original CMS source, rejects invalid and stale or already-published drafts, then uses the original writer and immediately checks the published projection. `cms_public_readback.status` is `PUBLIC_PROJECTION_OBSERVED` or `PUBLIC_PROJECTION_EVIDENCE_DUE`; this is projection proof, **not** independent public-browser or commercial evidence.
- `assets/cms-admin.js` and `cms.html`: saved-version QA, fail-closed unsaved editing, status chips and a legible 8-stage Heartbeat content journey.
- `portal-v2/operating-system/executive-cockpit.js` and `styles.js`: discoverable CMS operations link within the existing strategic cockpit; admin auth still enforced on actual CMS API.
- No new schedule, table, Netlify function name, publisher, social account, recovery worker or secret. Existing Required/CodeQL/merge/Netlify/portal authentication remain mandatory.

## What remains evidence due
The CMS contract cannot and must not declare the six old drafts published without an admin action. A CMS row status is not a payment receipt, SEO improvement, actual unique visitor, completed experiment or ONE BRAIN proven learning. The UI labels attribution, visits, CTA, leads, orders and learning as `EVIDENCE_DUE`. Continuous original Heartbeat runs should inspect these outputs as part of the original content-closed-loop but must not fake missing receipts.

## Verification / safety
Test: `node --test tests/brain-cms-powerhouse-one-loop-20261030.test.mjs tests/brain-cms-portal-release-assurance-20261030.test.mjs tests/cms-website-portal-v1.test.mjs`. Check `hasAdminRole`, revision-aware publish and original published-only provider query. Protected Required, CodeQL, exact merged SHA, Netlify deploy and authenticated production browser readback are required before technical `LIVE_VERIFIED`. Confirm direct CMS screen readback only with an authorized identity. All incident registration uses the original `public.brain_failure_registry`, maturity `OBSERVED` until independently demonstrated.

## Existing Growth attribution now carries the real CMS source revision
`assets/cms-runtime.js` already places `data-bg-cms-key` and `data-bg-cms-version` on public CMS-rendered elements. The original consent-aware `assets/meting.js` now adds `content_id=cms:<safe-element-key>:v<version>` **only when an existing CTA/form/phone click produces its normal `/api/growth-event`**. Source key/version come from the original published CMS overlay, never from a guessed purchase or collected form values. `tools/seo-growth/normalize-observation.mjs` and `datahub-contract.mjs` already accept `content_id` under the existing `content_type=page`. This uses the same event ID, original consent flag, duplicate-producer guard, network queue and provider acknowledgement. It does not create any extra event, identifier, user tracking store or session replay. If CMS overlay isn't present, no CMS content_id is attached. Future analysis can compare CTA results by CMS revision with comparable time windows and independently verified outcomes; no lift inferred yet. Regression: `tests/brain-cms-growth-lineage-20261030.test.mjs`.
