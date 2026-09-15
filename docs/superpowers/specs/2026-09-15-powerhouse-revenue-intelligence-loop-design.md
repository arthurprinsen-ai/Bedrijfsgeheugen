# Powerhouse Revenue Intelligence Loop — Design

Date: 2026-09-15
Status: approved in chat for specification
Branch: powerhouse-revenue-intelligence-loop-v1

## Objective

Extend the existing Bedrijfsgeheugen Powerhouse into one closed-loop commercial intelligence and execution system that continuously learns from people, companies, accounts, content, LinkedIn, DMs, e-mail, website/analytics, Notion and external signals. The system must improve next-best-action decisions using observed outcomes and realized revenue, without introducing a parallel CRM, second sales brain, duplicate learning store or Make dependency.

## Canonical principles

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- Supabase remains the transactional source of truth.
- Existing Powerhouse runtime lineage remains canonical: runtime_events → opportunities → sales_actions → sales_outcomes → forecasts/calibration → sales_learnings.
- Notion remains a knowledge/audit/sales projection, not an independent source of transactional truth.
- Chrome/LinkedIn remains an execution surface; no implicit autonomous outbound without an explicitly supported and permitted execution path.
- No fabricated cases, results, intent, revenue, opens or clicks. Unknowns remain unknown or trigger research.
- Every action must have an auditable reason, evidence lineage, prediction and outcome path.

## Architecture

### 1. Person Intelligence

Maintain a canonical derived person state from observed events and source records. It includes identity, company/role linkage, relevant topics, relationship warmth, interaction history, response/non-response history, last contact, known channel availability, contact pressure, observed interests, inferred influence and buying-committee role with confidence/evidence.

Person intelligence is derived from canonical events and connected sources rather than stored as an unrelated CRM copy. Derived state must be rebuildable.

### 2. Company / Account Intelligence

Aggregate multiple people and signals into one company/account state. It includes company identity, relevant business problems, signal history, active opportunities, people involved, source diversity, company freshness, known strategic movements and account-level commercial thesis.

Multiple person-level signals can jointly create or strengthen one account opportunity. Identity conflicts fail closed and are surfaced for resolution.

### 3. Buying Window & Intent Predictor

For each relevant account/person combination compute bounded probabilities and confidence for:

- problem fit
- timing / buying-window intensity
- buyer influence
- reply probability
- meeting probability
- proposal probability
- win probability
- expected revenue value

Inputs may include first-party relationship/activity evidence, Powerhouse history, content engagement, search/website signals and verified external company signals. Low evidence or stale evidence reduces confidence.

When uncertainty is material, the engine creates a research action rather than manufacturing certainty.

### 4. Buying Committee & Relationship Graph

Represent likely roles such as champion, influencer, blocker, technical evaluator, budget holder and decision maker only when supported by evidence. Track relationship edges among people, companies and known warm-introduction paths.

Account reasoning can recommend coordinated actions across multiple people but must enforce identity, dedupe and contact-pressure constraints.

### 5. Multichannel Next-Best-Action Orchestrator

Select the safest/highest-value next move from:

- observe / wait
- research
- LinkedIn public comment
- LinkedIn DM
- e-mail
- warm introduction request
- share verified evidence asset
- content follow-up
- meeting request
- proposal follow-up
- cooldown / stop

There are no fixed sequences. Every new observation/outcome may change the plan.

Ranking uses expected commercial value, confidence, timing, relationship fit, account strategy, contact pressure and applicable learnings. Public comments never become disguised cold pitches.

### 6. Follow-up & Contact Pressure

Per person/account maintain last outbound, last inbound, pending response, cooldown, due follow-up and channel pressure. The orchestrator may select 'do nothing' as the best action. Repeated non-response reduces priority and increases cooldown unless stronger new evidence appears.

### 7. Commercial Evidence Engine

Use a verified asset catalogue only. Each asset carries metadata such as target audience, problem, funnel stage, language, evidence strength, URL/file availability, freshness and CTA fit.

Default behavior is no attachment. Select the smallest verified proof that helps the buyer make the next decision. Unverified/unavailable assets are never presented as sendable.

### 8. Content-to-Revenue Attribution

Create auditable causal lineage across:

content/signal → person/account → prediction → action → message/asset/CTA → reply → meeting → proposal → win/loss → realized revenue

Attribution must distinguish observed causality from correlation. Reach/engagement are intermediate signals, not revenue outcomes.

### 9. Revenue Experimentation

Experiment dimensions can include problem framing, message opening, channel, timing, CTA, asset, audience and follow-up interval. Experiments must be identified before action where possible and outcomes must write back to the same lineage.

Promotion from candidate to proven learning requires minimum evidence/sample/confidence thresholds. Vanity metrics alone cannot prove a sales learning.

### 10. Model Calibration & Monitoring

Track forecast quality by target, channel and segment using at least:

- Brier score
- calibration error / reliability
- false positives
- false negatives
- sample size
- drift over time

Predictions must be labeled as predictions, not guarantees. Sparse segments fall back to broader priors and lower confidence.

### 11. Autonomous Research on Uncertainty

If the engine lacks enough evidence for a high-impact decision, create a research action that states what is missing. Research can use verified external sources and connected first-party sources. New evidence is ingested as canonical runtime events and then re-scored.

Research may discover company news, job signals, management changes, M&A/funding, public strategy/website shifts and other business events, but must preserve source/evidence and freshness.

### 12. Revenue Command Center

The operator-facing cockpit should prioritize a small number of actions with highest expected commercial value rather than an unfiltered signal feed. Each action shows:

person/account, why now, source evidence, recommended action, channel, draft/message context, proof asset, CTA, reply/meeting/proposal/win predictions, confidence, expected revenue value and next follow-up.

The UI must also expose writeback status and identity conflicts. Nothing is labeled complete when remote writeback is pending.

## Data flow

1. Observe first-party or verified external signal.
2. Normalize identity and dedupe.
3. Write canonical runtime event.
4. Rebuild/refresh person and account derived intelligence.
5. Update buying-window/account opportunity.
6. Produce forecast before action.
7. Rank and expose next-best-action.
8. Human/provider executes only through permitted path.
9. Capture sent/posted/reply/meeting/proposal/win/loss/revenue outcome.
10. Attach outcome to the original action and forecast.
11. Recalculate calibration and applicable learnings.
12. Re-score person/account and next-best-action.
13. Daily run verifies all critical loops and reports degraded if required readback is missing.

## Existing components to reuse

- powerhouse_runtime_events
- powerhouse_opportunities
- powerhouse_sales_actions
- powerhouse_sales_outcomes
- powerhouse_sales_learnings
- powerhouse_daily_runs
- powerhouse_action_queue / opportunity queue RPCs
- powerhouse-runtime Edge Function
- powerhouse-predictive-engine
- powerhouse-forecast-calibrator
- existing content/revenue learning stores
- existing LinkedIn/Chrome v96 runtime contract
- existing Notion sync/projection where applicable

No new parallel CRM, learning store, action queue or analytics brain may be created unless a capability is provably absent and cannot be represented canonically.

## Error handling / fail-closed rules

- Unknown person/account identity: no outbound; create identity/research obligation.
- Missing exact LinkedIn post/thread identity: no approximate navigation or send.
- Missing verified asset: recommend no asset or research/create one; never invent a URL/file.
- Missing outcome/readback: action remains pending/unknown, not successful.
- Failed Supabase writeback: queue dedupeable replay and surface degraded state.
- Conflicting evidence: preserve both evidence records, lower confidence and request research/resolution.
- Stale intelligence: decay confidence and buying-window score.
- No automatic fabricated revenue attribution.

## Production success criteria

A release is LIVE & BEWEZEN only when all relevant conditions are met:

1. Database migrations and Edge Functions are deployed to production.
2. CI/required tests are green on the merged main SHA.
3. Production readback proves new schema/runtime endpoints/functions exist.
4. At least one deterministic test event proves event → account/person intelligence → forecast → NBA → outcome → calibration/learning lineage without fabricated commercial outcomes.
5. Daily run reports the new intelligence/model-health sections and fails/degrades on missing critical readback.
6. Powerhouse learning/writeback records the release, root causes found during rollout and regression rules.
7. Chrome/browser-specific functionality is only marked LIVE & BEWEZEN after a real browser → Supabase writeback; otherwise that subcomponent remains DEELS LIVE.

## Implementation releases

### Release A — Person/Account Intelligence + Buying Windows

Add canonical derived intelligence, account aggregation, buying committee evidence, buying-window scoring and research obligations. Reuse current events/opportunities.

### Release B — Multichannel NBA + Follow-up / Contact Pressure

Extend the existing action decision layer with dynamic channel/action selection, cooldown, follow-up due state, warm-introduction opportunities and verified-asset gating.

### Release C — Attribution + Experimentation + Model Monitoring

Connect action variants and content lineage to downstream outcomes/revenue; add model-quality rollups, calibration/drift reporting and safe experiment promotion rules.

### Release D — Revenue Command Center + Operational Readback

Expose ranked account actions and health/readback. Extend daily production run so missing intelligence, prediction, outcome or writeback loops produce an explicit degraded status.

## Non-goals

- Rebuilding Apollo's contact database.
- Bulk autonomous spam or bypassing platform controls.
- Replacing Supabase with another CRM/database.
- Treating inferred intent as fact.
- Optimizing for impressions instead of commercial downstream outcomes.

## Security and privacy

Use only legitimate first-party, connected and public business-context sources. Store only commercially relevant evidence required for the business workflow. Preserve existing Powerhouse device-token scoping and server-side service-role isolation. Never ship Supabase service-role secrets in the extension or client.

## Learning contract

Every material change and incident follows: detect → prioritize → execute → tests → production → readback → outcome → root cause → regression/prevention → canonical writeback.

Every sales action follows: evidence → prediction → action → observed outcome → calibration → learning → revised next action.
