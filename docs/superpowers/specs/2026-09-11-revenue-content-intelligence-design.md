# Revenue Content Intelligence Design

## Goal
Turn the existing Brain/Powerhouse social, SEO, content-growth and revenue-learning components into one cross-channel closed loop that selects content opportunities and creative treatments for commercial outcomes rather than reach alone.

## Principles
- Extend existing Brain/Powerhouse contracts; do not create a second content brain.
- Optimize in this order: revenue/orders > proposals/offers > qualified leads/meetings/DMs > substantive interactions > clicks > reach/likes.
- Keep 20% exploration by default; exploit proven mechanisms for the remaining 80%.
- Personal LinkedIn defaults to observational business stand-up: recognizable scene, comic tension, emotional truth, business problem, conversational CTA.
- Company LinkedIn and blogs default to proof, cases, how-to, carousels, benchmarks, diagnostic offers and SEO opportunity capture.
- Every content decision records its source signals, hypothesis, creative dimensions, offer and expected commercial outcome.
- Missing data is unknown, never zero.
- A publication is not complete until publishing readback and later outcome evaluation exist.

## Signal model
The opportunity layer accepts signals from social analytics, website analytics, SEO/search demand, blog performance, connected-network/relationship signals, sales outcomes and Powerhouse opportunities. Each signal carries source, topic, audience, intent, pain, urgency, evidence strength and commercial value.

## Creative dimensions
Canonical dimensions include channel, persona, audience, topic, pain_trigger, fomo_trigger, hook_type, format, text_type, emotion, comedy_device, narrative_arc, proof_type, cta_type, offer_type, funnel_stage, source_signal, commercial_hypothesis and experiment_id.

## Decision policy
Rank opportunities with commercial value, intent/urgency, evidence strength, strategic fit, novelty and learning value. Choose one primary opportunity per content decision. Then choose either EXPLORE or EXPLOIT. EXPLORE varies one or two dimensions; EXPLOIT reuses proven mechanisms without copying complete winning assets.

## Personal LinkedIn contract
A personal post should normally contain: recognizable work scene -> absurd/comic observation -> self-aware or human turn -> emotional truth -> latent problem activation -> low-friction conversational CTA. Comedy is a mechanism, not the objective. Avoid fake stories, manufactured outrage, generic AI slogans and repetitive CTA language.

## Commercial loop
signal -> opportunity -> hypothesis -> creative recipe -> publish -> readback -> 24/48/72h metrics -> substantive interactions/DMs -> lead -> meeting -> proposal -> order/revenue -> learning -> next decision.

## Calendar
From 2026-09-12 through 2026-12-31 every day is covered by an experiment slot. The slot fixes the experiment intent and dimensions to test, not the final text. Final copy is generated near publication time from the newest available learnings and opportunity signals.

## Storage
Use existing `social_experiments`, `bg_post_kenmerken`, `powerhouse_content_recommendations`, `social_posts`, `social_metric_snapshots`, `social_learning_evaluations`, `powerhouse_opportunities`, `powerhouse_sales_actions`, `revenue_learning_evidence` and existing Brain learning projection. Supabase is canonical machine state; Notion is the human cockpit; Buffer remains publishing/readback.

## Failure policy
No empty day, no silent publishing failure, no promotion of a creative rule without sufficient evidence, no claim of revenue attribution without an attribution key/evidence chain. If the planned asset is missing, create a bounded recovery recommendation and publish via the existing fail-safe path.
