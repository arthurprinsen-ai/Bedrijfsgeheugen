# CMS Studio — canonieke visuele redactie, 2 november 2026

**Obligation:** cms-studio-one-brain-20261102-v1
**Parent:** original CMS/Powerhouse quality loop, original system map and publication obligations.
**Candidate status:** SOURCE_CANDIDATE. Protected checks, merge, Netlify and authenticated browser readback remain due.
**Failure fingerprint:** cms|editorial|technical-json-only-authoring-blocks-nontechnical-operators|20261102-v1.

## Diagnose / oorzaak
The original /cms.html is authenticated and has CMS CRUD, versioned revisions, public projection, status and quality gates. Editing a routine title, CTA, image alt or meta field still required directly manipulating JSON, knowing a CSS selector, and interpreting low-level statuses. This is an authoring usability defect, not evidence that the existing six bootstrap drafts have been approved or that a live website has zero content.

## Implemented increment
- Adds accessible structured editing fields for canonical text, link, image, meta, toggle and bounded structured briefs; advanced JSON remains available without lossy conversion.
- Integrates with the ORIGINAL cms-admin.js draft-save/publish/archive paths and their Netlify Identity/RLS/server-side expected_version/quality gates. The new editor never calls a provider, writes a database, creates an API endpoint, schedule or queue.
- Preserves the original raw JSON object keys when editing one structured field; every change emits the existing input event, which triggers the original unsaved-draft publication block.
- Adds a same-origin visual DRAFT-ONLY iframe preview for safe text/link/image/meta/toggle types. It never performs a real save/publish and never previews arbitrary HTML injection. URL updates are tested through original cmsSafeUrl.
- Surfaces client-side preliminary QA and a separate read-only CMS/Heartbeat status; client-side QA is explicitly NOT an editorial approval or commercial KPI.
- Adds regression tests for authentication/version/publication gates and non-invention of leads, orders and learning.

## Full target architecture — not claimed implemented by this increment
1. Website Studio: content component schemas, full page lifecycle, templates, mobile preview, rollback and accessible authoring.
2. Portal Studio: tenant-scoped content and onboarding help, not numerical KPI authority.
3. Media & Content Library: provenance, rights, upload approvals, accessibility, expiry and reuse.
4. AI Editorial Studio: buyer-first briefs, signed sources, role-based review and channel-specific quality.
5. Publishing Center: original publisher obligations, official provider IDs, independent readback, no alternative scheduler.
6. Search Studio: primary-source freshness, SEO, structured data and NL/EN parity.
7. Conversion Studio: original consented GA4 plus growth attribution, CTA hypotheses, controlled experiments, actual orders.
8. Campaign Studio: correlated content/release briefs linked to original campaign lineage, no new writer.
9. Content Intelligence: verified comparable time windows, uncertainty, statistical support, attributed paid revenue.
10. Governance & Learning: permissions, revisions, immutable evidence, root cause, regression, natural-run recurrence.

These modules require dedicated implementation and proof; a navigation link or documentation is NOT their completion.

## Existing one-loop authority and next handoff
CMS public.cms_content_items and public.cms_content_revisions own editable content; original portal-state-eu CMS actions own writes; Netlify Identity admins approve content. Original Content/Growth/SEO agents and provider-side publishers own channel delivery. ONE BRAIN owns learning, Heartbeat owns runtime health, portal displays truthful evidence and outcome uncertainty. Reuse original assets/meting.js source revision attribution. Never turn empty provider evidence into zero commercial outcomes or a green status.

Next source tasks: implement semantic component/page schema and media assets with original authorization; introduce multi-role editorial states only after designing explicit Supabase authorization, migration and readback; integrate native content calendar with original content_publication_obligations; run real end-to-end browser and protected release tests; verify no duplicate content/publishing; measure real user task completion and business outcomes.

## Required verification
- Node parse: node --check assets/cms-studio.mjs.
- Unit: node --test tests/cms-studio-20261102.test.mjs.
- Regression: original cms-website-portal and brain-cms-powerhouse suites, protected Required/CodeQL/BRAIN.
- Production: exact GitHub merge SHA → exact Netlify deployment → authenticated CMS browser → ordinary text change saved as draft → publication disabled until saved → authorized publish with expected_version → fresh public projection/readback → original client tracking with consent and independently verified outcomes.

Never auto-publish the old drafts. A safe failed approval is correctly BLOCKED, not a production outage. No promise that incidents never recur; retain recurrence controls until independently observed.
