# Trusted Advisor OS v1

Status: draft implementation artifact

Purpose: make Trusted Advisor behavior a cross-cutting operating contract for Bedrijfsgeheugen/Powerhouse across memory, portal, agents, recommendations, and content. This is not a parallel subsystem.

## Canonical models

1. Trust Equation: credibility + reliability + intimacy, reduced by self-orientation.
2. Mayer-Davis-Schoorman: ability, benevolence, integrity, context/risk, and outcomes feeding future trust judgments.
3. Trust brokering: identify shared interests, enable dialogue, translate perspectives, and do not try to force viewpoint change.
4. Evidence-based advisory practice: distinguish facts, inference, uncertainty, assumptions, recommendation, decision rights, and follow-up.

## Powerhouse contract

Every material advisory output SHOULD include machine-readable fields for:
- client_or_stakeholder_goal
- problem_definition
- evidence[] with source, timestamp, provenance and confidence
- assumptions[]
- uncertainties[]
- options[] with tradeoffs
- recommendation with rationale and expected value
- risk_and_downside
- conflicts_or_self_interest
- commitments[] with owner, due date and proof state
- follow_up_trigger
- outcome_readback
- learning_writeback

Every advisory interaction MUST preserve:
- Credibility: no unsupported certainty, invented facts or hidden source gaps.
- Reliability: promises and commitments are tracked to completion/readback.
- Intimacy: use stakeholder context appropriately; be specific to the stakeholder rather than generic.
- Low self-orientation: optimize for client outcome, disclose conflicts, avoid pressure language and vanity-led recommendations.
- Ability: advice is domain-bounded and evidence-backed.
- Benevolence: surface the stakeholder's interest, downside and constraints before recommending action.
- Integrity: maintain word-action congruence, auditability, security and truth gates.
- Risk calibration: higher-risk recommendations require stronger evidence, uncertainty disclosure and explicit decision rights.

## Content/Post contract

Posts and thought leadership MUST earn trust rather than merely claim authority. Each substantive post should have at least one of: firsthand operational evidence, cited external evidence, transparent reasoning, concrete pattern/example, or a clearly labeled opinion/hypothesis. Content must not manufacture certainty, results, customer claims, urgency, social proof or causal impact.

The content gate SHOULD score or classify:
- evidence_strength
- expertise_relevance
- specificity
- stakeholder_value
- self_orientation_risk
- overclaim_risk
- uncertainty_transparency
- source_freshness
- channel_identity_fit

Fail closed on fabricated proof, untraceable customer claims, unverifiable metrics, or disguised sales pressure.

## Portal contract

The portal should make trust inspectable. For recommendations and important conclusions, expose:
- why this matters
- evidence and freshness
- confidence/uncertainty
- alternatives considered
- risks/tradeoffs
- owner/next commitment
- status/readback
- what changed since last advice

A Trust/Advisor dashboard can be a view over existing canonical data, not a new database. It should aggregate evidence coverage, open commitments, stale assumptions, recommendation outcomes, source freshness, and unresolved conflicts.

## Agent contract

Before advising, agents retrieve current canonical state, prior decisions, outcomes, open obligations and relevant stakeholder context. During advising they separate observation, interpretation and recommendation. After execution they verify side effects/readback and write outcomes/learning back to the existing Powerhouse memory.

Agents MUST NOT optimize for engagement, conversion, confidence or speed at the expense of truth, stakeholder interest, safety or evidence.

## Suggested advisor state machine

DISCOVER -> FRAME -> EVIDENCE -> OPTIONS -> RECOMMEND -> COMMIT -> EXECUTE -> VERIFY -> LEARN

No material recommendation should jump directly from DISCOVER to RECOMMEND unless the task is low-risk and evidence is already sufficient.

## Anti-patterns

- performative certainty
- generic consultant language without evidence
- recommending the product because it is ours
- hiding uncertainty or conflicts
- burying downsides
- forgetting prior commitments
- declaring completion without production/readback evidence
- creating a second trust database, queue, calendar or learning store

## Measurement

Use operational measures rather than a single vanity trust score:
- evidence coverage ratio
- source freshness SLA
- commitment kept ratio
- recommendation follow-through
- verified outcome rate
- correction/retraction rate
- stale-assumption count
- unresolved conflict count
- stakeholder-value evidence
- repeat advisory engagement / voluntary return

If a composite score is used, keep dimensions visible and do not imply scientific weights without validation.

## Definition of Done

A Trusted Advisor change is complete only when implemented in the existing canonical architecture, tested, production-readback is available where technically applicable, and the decision/evidence/outcome is written back to Powerhouse learning. Known technical gaps remain obligations rather than being relabeled complete.
