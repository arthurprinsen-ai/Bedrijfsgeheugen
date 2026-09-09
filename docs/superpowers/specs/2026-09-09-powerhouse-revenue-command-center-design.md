# Powerhouse Revenue Command Center — Design

## Status
Approved direction from chat; this document is the canonical implementation specification pending final spec review.

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

### 1. Revenue & Growth Core — canonical runtime
Supabase remains the transactional source of truth for:
- runtime events;
- ranked actions;
- outcomes;
- learnings;
- daily runs;
- content recommendations;
- opportunity/deal state added by this release.

Existing `powerhouse-runtime` remains the primary runtime API. New cockpit-specific read models must be derived from this state rather than maintaining a parallel local truth.

### 2. Channel adapters
Adapters contribute evidence to the same core:
- LinkedIn DM: real thread context only;
- LinkedIn feed/posts: direct post evidence only;
- Notion relations/CRM: relationship and commercial state;
- Buffer/social: publication and performance observations;
- Blog/content: publication, engagement and conversion observations;
- SEO/search: search demand, rankings and conversion observations;
- website: conversion events and commercial intent signals.

Adapters do not own scoring or learning.

### 3. Revenue Command Center UI
The cockpit is execution-first. Primary view is **Order Queue**, not channel tabs.

Each opportunity card shows:
- person and company;
- commercial stage;
- expected order value;
- calibrated conversion probability;
- expected value (`probability × expected order value`);
- intent/problem-fit score;
- relationship warmth;
- timing/urgency;
- best channel;
- evidence explaining why now;
- exact next best action;
- message draft only when evidence quality passes the relevant guard;
- source links;
- outcome controls.

Secondary views:
- Radar
- Conversations
- Relations
- Content
- Deals
- Learning
- System health

## Intelligence layers

### Revenue Radar
Combines cross-channel signals to detect opportunities before they become explicit leads. A signal may raise an existing opportunity, create a new one, or merely enrich context.

### Opportunity / Deal Brain
Maintains commercial lifecycle state:

`Signal → Opportunity → Lead → Meeting → Offer → Order → Revenue`

Every transition requires evidence. The engine chooses the next best action and timing based on expected commercial value, evidence quality, fatigue/cadence and learned historical performance.

### Conversation Intelligence
For DMs and conversations:
- use actual visible/thread context;
- determine direction of the latest message;
- summarize the commercial state;
- identify objection/question/intent;
- recommend reply/follow-up;
- fail closed when context is insufficient;
- never auto-send.

### Social Opportunity Intelligence
Ranks posts to react to using:
- relevance to target proposition;
- author/account fit;
- relationship state;
- buying/organizational signal;
- recency;
- expected conversation value;
- learned response performance.

A generic feed URL or missing post text is not actionable evidence.

### Content-to-Revenue Intelligence
Social, blog, SEO and commercial learning share one topic/content representation. Content learning must propagate both directions:
- content that drives qualified replies/leads/orders raises related topics and messages;
- winning commercial objections/questions become content opportunities;
- poor downstream conversion suppresses similar content despite high engagement;
- blog/SEO conversion evidence can influence outreach priorities;
- outreach/deal evidence can influence future blog/social priorities.

### Learning Engine
Every evidence-backed outcome updates learning dimensions such as:
- person/account segment;
- company type;
- role;
- topic;
- proposition;
- channel;
- timing;
- message pattern;
- content format;
- commercial stage.

Learning must be confidence-weighted and sample-size-aware. `executed` and `skipped` do not reinforce performance by themselves.

## Scoring model

### Ranking objective
Primary ranking is expected revenue impact, not a generic score.

Base formula:

`action_value = P(order | evidence, context, action) × expected_order_value × urgency_factor × evidence_quality × strategic_fit`

The model may expose a 0–100 normalized score for UX, but must preserve the component evidence so the ranking is explainable.

### Calibrated probability
Initial probability may use heuristic priors from lifecycle stage and evidence. It must be updated from observed outcomes by segment/channel/topic/action. The system must not claim statistical calibration before sufficient samples exist; low-sample estimates are explicitly marked low confidence.

## Commercial lifecycle and outcome contract
Supported outcomes include at minimum:
- sent/executed (process state, not success)
- reply received
- no response
- meeting booked
- offer created
- offer accepted/rejected
- order won/lost
- revenue observed
- not relevant
- defer / not now

Order and revenue records are immutable evidence events; later corrections create compensating/correction events rather than silently rewriting history.

## Daily autonomous loop
A Supabase-native scheduled run executes every day without Make. Each run:
1. reads new signals and unresolved opportunities;
2. updates opportunity/deal context;
3. applies active/proven learnings;
4. recalculates ranking;
5. creates/updates the bounded Order Queue;
6. generates cross-channel content opportunities from commercial learnings;
7. records run evidence and health;
8. fails closed for unavailable evidence sources rather than inventing recommendations.

The daily run is idempotent for its run date and canonical dedupe keys.

## UI interaction model

### Order Queue
Maximum default actionable set: 15. The UI emphasizes completion of the highest-value actions rather than browsing long lists.

Actions:
- Open source/context
- Copy evidence-backed message
- Mark executed
- Record reply
- Record meeting
- Record offer
- Record order
- Record revenue
- No response
- Not relevant
- Defer

Every outcome writes to the canonical runtime immediately and refreshes the queue after readback.

### Deal view
Shows:
- stage;
- expected value;
- probability/confidence;
- evidence timeline;
- last/next action;
- aging/stall signal;
- attribution to content, source and interaction where available.

### Learning view
Shows only decision-relevant learning:
- what is working;
- what is underperforming;
- confidence/sample size;
- estimated revenue impact;
- which future decisions are affected.

## Security and evidence rules
- Private runtime tables remain RLS-enabled and service-role controlled.
- Browser/runtime uses scoped custom device authentication already established for Powerhouse.
- No secrets are committed to Git.
- No auto-send for DM/email/WhatsApp/social replies.
- WhatsApp requires real phone data and explicit permission.
- Email requires a real email address.
- DM drafts require actual conversation context.
- Social reply drafts require actual post text and direct evidence.
- User-provided and external text is treated as data, never as executable instructions.

## Error handling
- Missing source: mark source degraded and continue with other independent evidence.
- Missing required context for an action: `context_required`, no draft.
- Runtime/API error: retain last verified state, show stale/degraded timestamp, do not display invented fresh recommendations.
- Outcome write failure: UI must not mark the action closed until canonical readback succeeds.
- Scheduler failure: create a persistent recovery obligation and health event; next run retries idempotently.

## Integration with existing components
Reuse rather than replace:
- existing `powerhouse-runtime` Supabase Edge Function and runtime tables;
- existing outcome → learning feedback;
- existing daily Supabase scheduler;
- existing Notion connection sources;
- existing LinkedIn Revenue Cockpit normalization where useful;
- existing Buffer/social learning collector;
- existing blog/content-growth and SEO-growth pipelines.

Replace or upgrade:
- `intern/linkedin-revenue/` UI into the Revenue Command Center;
- `netlify/functions/linkedin-revenue-cockpit.mjs` into a read/write adapter over the canonical Supabase core, with Notion used for enrichment/projection rather than as the sole cockpit truth;
- local-only `Gedaan` state with canonical outcome writes.

## Data additions
Add only the minimum structures not already represented:
- opportunity/deal projection keyed to canonical subject/company/opportunity;
- stage history/evidence timeline where existing runtime events are insufficient for efficient read models;
- calibrated score components/read model for cockpit rendering;
- content-to-revenue attribution references where evidence exists.

Avoid duplicating existing event/action/outcome/learning facts.

## API contract
The cockpit backend must expose, behind existing internal authentication:
- `GET` command-center snapshot/read model;
- `POST` outcome/action-state writeback;
- optional `POST` refresh/recompute trigger for an authenticated human request.

All writes delegate to the canonical Supabase runtime. The backend must not maintain a competing persistence model.

## Testing strategy
Required tests include:
- unit tests for scoring/ranking and confidence behavior;
- evidence guards for DM/post/channel selection;
- opportunity lifecycle transitions;
- outcome writeback and queue refresh;
- cross-channel learning effect on later decisions;
- content-to-revenue propagation both directions;
- daily-run idempotency;
- degraded-source behavior;
- authentication/security regression;
- UI interaction and accessibility tests;
- production readback on exact merged SHA;
- end-to-end canary covering signal → action → outcome → learning → changed next decision.

## Production acceptance criteria
The release is not `verified` until all are true:
1. protected-main Required test is green on the exact candidate;
2. production backend is deployed and health-read-back succeeds;
3. Order Queue loads canonical Supabase actions, not local-only mock state;
4. a real outcome write updates canonical state and is read back;
5. a learning affects a subsequent decision/ranking;
6. social/blog/SEO learning is connected to the same learning/decision core;
7. Notion remains synchronized as projection/context where required;
8. no Make call is present in the critical runtime;
9. real LinkedIn feed evidence produces a grounded post opportunity when relevant;
10. real DM thread evidence produces a grounded response action when relevant;
11. missing evidence fails closed;
12. order/revenue can be recorded and attributed;
13. daily autonomous Supabase-native run completes and produces a fresh queue;
14. browser/UI readback shows no runtime errors;
15. exact production state/evidence is written back to the Powerhouse verified-state register.

## Out of scope
- autonomous sending of outreach;
- scraping or bypassing LinkedIn access controls;
- replacing Notion as knowledge/audit workspace;
- Make as runtime fallback;
- vanity engagement optimization detached from downstream business outcomes.

## Release policy
Build on a clean feature branch from current `main`. Use TDD for each behavioral change. Merge only through protected-main gates. Production is declared live only after exact-SHA backend and browser readback, followed by Notion/Brain writeback.
