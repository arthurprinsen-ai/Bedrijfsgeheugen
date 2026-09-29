# Powerhouse Behavioral Landing Revenue Engine v2

Date: 2026-09-29  
Fingerprint: `powerhouse-behavioral-landing-revenue-v2`

## Position in Powerhouse
This is not a standalone CRO product. It is the behavioral decision layer inside the canonical `seo-conversion-orders` capability and is inherited by Growth Swarm and Persuasion Revenue Optimizer.

## Objective
Optimize commercial pages for the strongest observed business outcome available:

`realized revenue -> paid orders -> qualified proposals -> qualified meetings -> qualified leads -> CTA progression -> engagement`

Traffic, click-through rate, scroll depth and time-on-page are supporting evidence, never the commercial north star.

## Autonomous decisions
Within the bounded optimizer, Powerhouse may decide:
- hero/message match;
- primary and secondary CTA;
- proof placement and sequence;
- objection handling;
- risk reversal;
- pricing-anchor wording;
- progressive disclosure;
- commitment step;
- page-section order;
- Frisse Blik versus direct-conversation routing.

## Behavioral models
The engine can use Cialdini principles, Jobs-to-be-Done, PAS/AIDA/4P, loss aversion and prospect theory, Fogg Behavior Model, Hick-Hyman choice reduction, cognitive fluency, commitment ladders, specificity and choice architecture.

These are decision-support models, not permission to manipulate visitors.

## Guardrails
- maximum three reversible high-confidence autonomous changes per daily cycle;
- every candidate needs evidence, hypothesis, measurable downstream event and rollback condition;
- retain incumbent or use a bounded challenger when evidence is insufficient;
- rollback on material regression in trust, accessibility, mobile readability or qualified conversion;
- never fabricate testimonials, outcomes, urgency, scarcity, social proof, benchmarks or guarantees;
- hidden costs, preselected consent and confirmshaming are forbidden.

## Canonical authority
- `config/seo-growth-loop.json`
- `config/seo-optimization-allowlist.json`
- `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`
- `.agents/skills/powerhouse-growth-swarm/SKILL.md`
- `.agents/skills/powerhouse-persuasion-revenue/SKILL.md`
- `docs/brain/component-registry.json`
- `platform/system-map/canonical-system-map.mjs`
- `brain/learning/2026-09-29-seo-conversion-orders-v1.json`
- `tools/site-shell/apply-money-page-order-conversion.mjs`

## Learning loop
Search/visitor evidence -> experience decision -> protected change -> production readback -> CTA/lead/proposal/order/revenue outcome -> Brain learning -> next decision.

The final V18 build authority enforces the qualified-order path after page generators and normalizers, so generated HTML cannot silently restore an older conversion path.

## Writeback contract
Any material change to this capability must update the canonical runtime, relevant skills, Brain learning, component registry, system map, human documentation and regression evidence in the same delivery lineage. Missing writeback means the change is incomplete.
