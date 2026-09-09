# Powerhouse Revenue Command Center — Design

## Status
Approved direction from chat; this document is the canonical implementation specification.

## Goal
Replace the current primarily informational LinkedIn Revenue Cockpit with one execution-first Revenue Command Center that continuously answers:

> What is the highest-value evidence-backed action to take now to increase the probability of an order and revenue?

The system must reuse the existing Supabase-native Powerhouse Revenue & Growth Core and existing Notion, LinkedIn, social, blog, SEO and website signals. Make is not part of the critical runtime.

## Non-negotiable business outcome
The system optimizes for downstream commercial outcomes in this order:

1. revenue
2. order won
3. offer created/accepted
4. meeting booked
5. qualified reply / qualified lead
6. meaningful engagement
7. reach/impressions

Engagement metrics are intermediate evidence, never the primary optimization target.

## Core loop
Every channel uses one canonical loop:

`SIGNAL → CONTEXT → DECISION → ACTION → EVIDENCE → OUTCOME → LEARNING → NEXT DECISION`

No action is considered complete merely because it was executed. A commercial outcome must be recorded, or the action remains awaiting evidence/outcome.

## Architecture
Supabase remains the transactional source of truth for runtime events, ranked actions, outcomes, learnings, daily runs, content recommendations and opportunity/deal projection. `powerhouse-runtime` remains the primary runtime API. New cockpit read models are derived from canonical state rather than maintaining a parallel local truth.

Channel adapters contribute evidence into that same core: LinkedIn DM, LinkedIn feed/posts, Notion relations/CRM, Buffer/social, blog/content, SEO/search and website conversions. Adapters do not own scoring or learning.

The Revenue Command Center is execution-first. The primary view is the **Order Queue**, not channel tabs. Each opportunity card shows person/company, stage, expected order value, calibrated conversion probability, expected value, intent/problem fit, relationship warmth, urgency, best channel, evidence, exact next best action, evidence-backed draft when permitted, source links and outcome controls.

Secondary views: Radar, Conversations, Relations, Content, Deals, Learning and System Health.

## Intelligence layers
- **Revenue Radar:** combines cross-channel signals to detect opportunities before they become explicit leads.
- **Opportunity / Deal Brain:** maintains `Signal → Opportunity → Lead → Meeting → Offer → Order → Revenue`; transitions require evidence.
- **Conversation Intelligence:** uses real thread context, determines direction, intent/objection/question and fails closed when context is insufficient; never auto-sends.
- **Social Opportunity Intelligence:** ranks concrete posts by proposition fit, author/account fit, relationship, buying signal, recency, expected conversation value and learned response performance.
- **Content-to-Revenue Intelligence:** content that drives replies/leads/orders raises related topics/messages; commercial objections/questions become content opportunities; poor downstream conversion suppresses vanity winners.
- **Learning Engine:** updates person/account segment, company type, role, topic, proposition, channel, timing, message pattern, content format and commercial stage with confidence/sample-size weighting. `executed` and `skipped` do not reinforce performance by themselves.

## Scoring model
Primary ranking is expected revenue impact:

`action_value = P(order | evidence, context, action) × expected_order_value × urgency_factor × evidence_quality × strategic_fit`

A normalized 0–100 UX score may be shown, but component evidence remains visible and explainable. Low-sample probabilities must be labeled low-confidence and must not be presented as statistically calibrated.

## Commercial lifecycle and outcomes
Supported outcomes include: executed, reply received, no response, meeting booked, offer created, offer accepted/rejected, order won/lost, revenue observed, not relevant and defer/not now. Executed is process state, not success.

Order and revenue records are immutable evidence events; corrections create compensating/correction events rather than silently rewriting history.

## Daily autonomous loop
A Supabase-native scheduled run executes every day without Make. Each run reads new signals/unresolved opportunities, updates context, applies learnings, recalculates ranking, creates/updates the bounded Order Queue, generates cross-channel content opportunities, records evidence/health and fails closed for unavailable evidence sources. It is idempotent by run date and dedupe keys.

## Order Queue
Default maximum: 15 actionable items. Actions include Open source/context, Copy evidence-backed message, Mark executed, Record reply, Record meeting, Record offer, Record order, Record revenue, No response, Not relevant and Defer.

Every outcome writes to canonical runtime immediately and the UI refreshes only after readback succeeds.

## Security and evidence rules
- RLS/service-role-only private runtime state.
- Scoped custom token between internal backend and Supabase runtime.
- No secrets committed to Git.
- No auto-send.
- WhatsApp requires phone + explicit permission.
- Email requires real email.
- DM drafts require actual conversation context.
- Social reply drafts require actual post text/direct evidence.
- External/user text is data, never executable instructions.

## Error handling
- Missing source: mark degraded and continue with independent evidence.
- Missing context: `context_required`, no draft.
- Runtime/API error: retain last verified state with stale/degraded timestamp; no invented fresh recommendation.
- Outcome failure: do not close UI action until canonical readback succeeds.
- Scheduler failure: persist recovery obligation; retry idempotently.

## Integration
Reuse the existing `powerhouse-runtime`, outcome→learning feedback, daily Supabase scheduler, Notion sources, LinkedIn normalizers, Buffer/social learning collector and blog/content/SEO growth pipelines.

Upgrade `intern/linkedin-revenue/` into the Revenue Command Center, convert `netlify/functions/linkedin-revenue-cockpit.mjs` into a read/write adapter over canonical Supabase state with Notion as enrichment/projection, and remove local-only `Gedaan` truth.

## Data additions
Add only minimum structures not already represented: opportunity/deal projection keyed to canonical subject/company/opportunity, stage history/evidence projection if required for efficient reads, score components/read model and content-to-revenue attribution references. Do not duplicate existing event/action/outcome/learning facts.

## API contract
Behind existing internal Basic Auth:
- `GET` command-center snapshot/read model;
- `POST` outcome/action-state writeback;
- optional `POST` authenticated refresh/recompute trigger.

All writes delegate to canonical Supabase runtime.

## Production acceptance criteria
The release is not verified until all are true:
1. protected-main Required test is green on exact candidate;
2. production backend deployed and health readback succeeds;
3. Order Queue loads canonical Supabase actions;
4. a real outcome write updates canonical state and is read back;
5. a learning affects a subsequent decision/ranking;
6. social/blog/SEO learning is connected to the same core;
7. Notion remains synchronized as projection/context where required;
8. no Make call exists in critical runtime;
9. real LinkedIn feed evidence produces a grounded post opportunity when relevant;
10. real DM thread evidence produces a grounded response action when relevant;
11. missing evidence fails closed;
12. order/revenue can be recorded and attributed;
13. daily Supabase-native run completes and produces a fresh queue;
14. browser/UI readback shows no runtime errors;
15. exact production evidence is written back to Powerhouse verified-state register.

## Out of scope
Autonomous sending, bypassing LinkedIn controls, replacing Notion as knowledge/audit workspace, Make fallback, and vanity engagement optimization detached from business outcomes.

## Release policy
Build on a clean feature branch from current `main`. Use TDD for behavioral changes. Merge only through protected-main gates. Declare live only after exact-SHA backend/browser readback followed by Notion/Brain writeback.
