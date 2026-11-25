# Feed verified post learnings into the next approved company post or blog

Powerhouse already produces content recommendations and publishes through its protected canonical system. The previous content orchestrator did not read the verified social-learning dataset before generating the next company LinkedIn post or blog. This adds a **read-only, same-tenant feed** from `public.social_learnings` to the existing editorial model.

A learning may influence the next company/blog artifact only when it is truly PROVEN, positive, evidence-backed, non-expired, recently validated, based on at least five samples and adequately confident. No personal LinkedIn story, tenant data, deterministic Mira caption, order or customer claim is inferred from an aggregate social metric. If no proven owned-brand learning exists, content generation proceeds without experimental claims. The existing source-grounded recommendation, identity, consent and publication release checks remain mandatory.

**Current gap:** as of 2026-10-24 the real `bedrijfsgeheugen` tenant has no PROVEN social-learnings yet. Source deployment and actual next-post application therefore require later verified evidence; this PR alone does not certify a performance uplift.
