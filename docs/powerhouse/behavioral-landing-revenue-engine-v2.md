# Behavioral Landing Revenue Engine v2 — Powerhouse integration

Date: 2026-09-29  
Fingerprint: `powerhouse-behavioral-landing-revenue-v2`

## Purpose
Make every commercial landing page an evidence-gated revenue surface inside the existing Powerhouse Growth Swarm. The system optimizes for qualified commercial outcomes, not visual novelty or raw clicks.

## Canonical owners
- `config/seo-growth-loop.json` — decision engine, models, page contract, experiment policy and revenue metric order.
- `config/seo-optimization-allowlist.json` — allowed reversible CRO actions and blocked dark patterns.
- `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md` — canonical website/CRO operating skill.
- `.agents/skills/powerhouse-growth-swarm/SKILL.md` — commercial orchestration inheritance.
- `.agents/skills/powerhouse-persuasion-revenue/SKILL.md` — persuasion inheritance.
- `docs/brain/component-registry.json` — System Map / Brain capability projection.

## Decision loop
intent + source + funnel state + observed behavior -> page decision -> protected delivery -> production readback -> CTA/lead/proposal/order/revenue outcome -> learning -> next decision.

## Autonomous decision surface
Powerhouse can decide:
- hero and message match;
- primary and secondary CTA;
- proof placement and proof order;
- objection handling;
- risk reversal;
- pricing-anchor wording;
- page-section order;
- progressive disclosure;
- commitment step;
- scan versus conversation path.

## Behavioral models
Cialdini, Jobs-to-be-Done, PAS/AIDA/4P, loss aversion, prospect theory, Fogg Behavior Model, Hick-Hyman, cognitive fluency, commitment ladder, specificity, progressive disclosure, choice architecture and evidence-backed curiosity/open loops.

## Commercial objective
1. realized revenue;
2. paid orders;
3. qualified proposals;
4. qualified meetings;
5. qualified leads;
6. CTA progression;
7. engagement.

Micro-metrics cannot independently promote a variant when stronger downstream evidence exists.

## Guardrails
No fabricated proof, urgency, scarcity, benchmarks, customer results or guarantees. No hidden costs, preselected consent, confirmshaming or deceptive choice architecture. Accessibility, mobile readability, trust and truth are protected metrics.

## Autonomy and rollback
The existing daily optimizer can execute at most three reversible high-confidence changes per cycle. Every candidate needs a hypothesis, target metric, evidence and rollback condition. Insufficient evidence means retain incumbent or run a bounded challenger. Material trust or qualified-conversion regression means rollback.

## System integration
This capability is registered as `CAPABILITY_SEO_CONVERSION_ORDERS`, upgraded to “SEO + Behavioral Conversion-to-Orders Engine v2”, linked to the Growth Swarm and Persuasion Revenue Optimizer. It is therefore part of the same Powerhouse Brain/System Map rather than a separate marketing stack.
