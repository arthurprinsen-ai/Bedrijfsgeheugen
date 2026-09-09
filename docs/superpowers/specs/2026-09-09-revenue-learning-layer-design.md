# Revenue Learning Layer — Design

## Goal
Create one canonical learning loop across LinkedIn, Instagram, blogs, website behavior, leads, meetings, proposals, orders and revenue. The system must optimize for commercial outcomes first and engagement only when higher-value evidence is unavailable.

## Existing sources
- Social: `social_posts`, `social_metric_snapshots`, `social_learnings`, applications and decisions.
- Website/blog behavior: `growth_events`, `growth_page_daily`.
- Commercial outcomes: `growth_outcomes`, `commercial_leads`.

## Canonical contract
Every content asset is represented by `content_id`, `channel`, `canonical`, `published_at`, content attributes, and `attribution_root_key` where available.
Every evidence row is normalized to: views/impressions, clicks, substantive interactions, leads, qualified leads, meetings, proposals/offers, orders, revenue_eur.
Every learning records: fingerprint, component scope, claim, primary metric, baseline, effect size, sample size, confidence, lifecycle status, evidence refs, first seen, last validated, review date.

## Commercial priority
1. revenue_per_exposure
2. order_rate
3. proposal_rate
4. qualified_lead_rate
5. meeting_rate
6. lead_rate
7. click_rate
8. substantive_interaction_rate
9. engagement/reach fallback
A positive lower-priority effect may never override contradictory higher-priority evidence.

## Architecture
1. `revenue-learning-store` in Supabase exposes canonical content/evidence/learning operations.
2. Native scheduled Netlify evaluator runs hourly and evaluates due social/blog/web evidence.
3. Social evidence is projected from existing social tables; blog/web evidence is projected from growth tables. Existing source tables remain authoritative.
4. The evaluator creates or updates unified `revenue_learnings` and reconciles `revenue_learning_applications`.
5. `revenue-learning-context` exposes a bounded set of PROVEN learnings for content generation, ordered by expected commercial value and confidence.
6. Every generated social post or blog can record considered/applied learning IDs, creating measurable causal follow-up evidence.

## Attribution
Prefer exact `attribution_root_key`. Fall back to canonical content URL only when the attribution root is absent, and mark evidence quality as `INFERRED`. Never fabricate zero outcomes when data is missing.

## Blog handling
A blog/page cohort compares content with the same page role/funnel intent where possible. Daily website metrics aggregate into 24h/72h/7d evidence windows. Blog learnings can cover title/hook, topic/pillar, proof pattern, CTA, format and funnel intent when metadata is available; missing metadata remains null rather than guessed.

## Social handling
Existing 24/48/72 social evaluator remains intact. Unified revenue evaluation consumes its underlying posts/snapshots and commercial attribution so social engagement learnings can be superseded by later lead/order/revenue evidence.

## Lifecycle
CANDIDATE -> TESTING -> PROVEN -> WEAKENING -> RETIRED. Promotion requires >=5 comparable samples, >=2 publication dates, confidence >=0.75, positive primary commercial effect and no higher-priority contradiction.

## Safety and failure behavior
- Service-token protected writes/read context.
- Idempotent evaluation/application IDs.
- Missing evidence creates an obligation; it is not treated as zero.
- Last-known-good projection remains available if evaluation/store fails.
- Existing social and growth ingestion remain backward compatible.

## Production success criteria
1. Schema and store are live with RLS/service-only access.
2. Native evaluator and context endpoint are deployed and scheduled without Make/Windsor dependency.
3. At least one real social or blog/web content asset is read from production data and evaluated into unified evidence.
4. Context endpoint can return bounded PROVEN revenue learnings or a valid empty projection when evidence is insufficient.
5. Required, BRAIN delivery, dedicated revenue-learning tests and production readback are green on the exact merged SHA.
