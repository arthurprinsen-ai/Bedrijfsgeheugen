# Powerhouse Unified Revenue & Growth Core — Design

Date: 2026-09-09
Status: Approved design, implementation pending
Branch: `powerhouse-unified-revenue-growth-core`

## 1. Objective

Powerhouse must become one canonical closed-loop commercial intelligence core. Social, Buffer, LinkedIn feed, LinkedIn DM, Notion relationships, blogs, SEO, website conversion, leads, meetings, offers, orders and revenue must no longer learn in separate islands.

The system optimizes for downstream commercial outcomes. Reach, impressions, likes, comments, clicks, rankings and engagement are evidence, not final goals. Their value is determined by the extent to which they predict or contribute to qualified conversations, opportunities, offers, orders and revenue.

The core loop is:

`SIGNAL -> CONTEXT -> DECISION -> ACTION -> EVIDENCE -> OUTCOME -> LEARNING -> NEXT DECISION`

Every producer and consumer in Powerhouse must participate in this loop.

## 2. Architectural choice

Use one Supabase-native Revenue & Growth Brain Core as the transactional system of record and learning engine. Channel-specific systems are adapters around this core.

### Core responsibilities

1. Canonical event ingestion and idempotency.
2. Identity resolution across person, company, content, campaign and opportunity.
3. Context assembly from recent interactions and historical outcomes.
4. Decisioning and next-best-action ranking.
5. Evidence-bound action generation.
6. Outcome attribution.
7. Learning updates that change future decisions.
8. Daily autonomous work generation.
9. Auditability, rollback and regression guards.

### Channel adapters

- LinkedIn feed adapter
- LinkedIn DM adapter
- Notion relationship adapter
- Buffer/social metrics adapter
- Blog/SEO adapter
- Website/conversion adapter
- CRM/sales outcome adapter

Adapters must not contain independent learning logic that conflicts with the core. They normalize source-specific data into the canonical event contract and consume decisions/actions from the core.

## 3. Canonical entities

The core operates on the following stable identities:

- `person_key`: one commercial relationship/person
- `company_key`: one organization/account
- `content_key`: one canonical content concept or asset
- `channel_key`: LinkedIn, Instagram, Facebook, X, blog, website, email, WhatsApp where evidence permits
- `campaign_key`: optional commercial/content campaign
- `opportunity_key`: commercial opportunity
- `action_key`: one next-best-action
- `outcome_key`: observed downstream result

Identity must be resolved by deterministic keys first and explicit mappings second. Fuzzy merging is never allowed to silently overwrite identities.

## 4. Canonical event contract

All producers emit one normalized envelope with at least:

- event id / idempotency key
- source
- event type
- occurred at
- person/company/content/opportunity keys when known
- channel
- source URL or external identifier
- raw evidence/context payload
- data quality / confidence

Representative event types include:

- `social_post_published`
- `social_metric_observed`
- `linkedin_post_observed`
- `linkedin_post_replied`
- `dm_inbound`
- `dm_outbound`
- `connection_activated`
- `blog_published`
- `seo_metric_observed`
- `website_conversion`
- `lead_created`
- `meeting_booked`
- `offer_created`
- `order_won`
- `revenue_observed`

Events are immutable evidence. Corrections are new events, not destructive history edits.

## 5. Decision engine

The decision engine ranks actions using evidence from all channels.

Priority is derived from:

- urgency / waiting-on-me state
- commercial fit
- relationship warmth
- recency
- content/topic affinity
- source confidence
- expected commercial value
- prior response rate
- learned channel effectiveness
- learned topic effectiveness
- contact pressure / cooldown
- opportunity stage

The engine must be deterministic for the same state and explain the factors behind each score.

A decision is not send-ready unless the evidence needed for that action exists. Examples:

- No DM reply without real conversation context.
- No LinkedIn comment without real post text.
- No WhatsApp action without real phone evidence and explicit permission/policy.
- No email action without a real email address.

## 6. Cross-channel learning

Learning is shared across channels while preserving attribution.

Examples:

- A LinkedIn topic that repeatedly produces replies, meetings and orders increases the priority of related future LinkedIn posts and related blog topics.
- A blog topic producing qualified organic leads increases the score of related social posts, outreach context and website content.
- A social format with high impressions but no downstream movement is not reinforced merely for engagement.
- A DM approach that consistently produces meetings is reinforced for similar personas/accounts, subject to confidence and contact policy.

Each learning record contains:

- fingerprint/dedupe key
- scope
- subject/topic/persona/channel keys
- evidence
- hypothesis
- measured effect
- confidence
- sample size where available
- status: candidate, active, proven, rejected
- expiry/revalidation date when appropriate

No single observation can become a high-confidence global rule.

## 7. Revenue-first attribution

Commercial outcomes have the highest weight:

1. revenue / order won
2. offer / qualified opportunity
3. meeting / qualified conversation
4. reply / meaningful inbound
5. lead / explicit conversion
6. click / visit / engagement
7. reach / impression

The system retains upstream metrics but learns their value from downstream correlation and attribution. It does not optimize blindly for vanity metrics.

Attribution supports direct and assisted influence. It must preserve the evidence chain rather than claiming false causality.

## 8. Daily autonomous loop

Powerhouse must work every day without Make.

A scheduled Supabase-native daily cycle will:

1. ingest/refresh available observations from connected adapters;
2. identify stale or incomplete evidence;
3. recompute learnings where new outcomes exist;
4. rank next-best-actions;
5. create a bounded daily action queue;
6. create content/topic recommendations;
7. surface anomalies and blockers;
8. write the current projection for cockpit and Notion;
9. record its own run outcome and health evidence.

The daily loop must be idempotent and safe to rerun.

## 9. Social and Buffer integration

The existing Buffer-first collector becomes an adapter into the unified core. It keeps source-specific normalization but does not own a separate learning brain.

Buffer observations such as impressions, reach, likes, comments, shares, saves, clicks, profile visits and follower gains are ingested as `social_metric_observed` events keyed to the canonical content identity.

Publication metadata and content text are linked to content concepts/topics so downstream sales outcomes can teach future content planning.

## 10. Blog, SEO and website integration

Blog and SEO become first-class producers/consumers of the same brain.

Signals include:

- publish/update events
- search impressions and clicks
- ranking/search visibility where available
- page engagement/conversion
- CTA events
- lead creation
- qualified downstream outcomes

The core can recommend:

- next blog topic
- refresh/expand/retire decisions
- CTA changes
- internal link emphasis
- social repurposing priorities
- sales outreach context based on high-performing themes

Content changes remain subject to existing website/release gates.

## 11. LinkedIn feed, DM and relationships

LinkedIn feed observations become evidence events containing real post text and source URLs. Reactions are proposed only when the post is relevant and evidence exists.

DM events preserve actual conversation context. Drafts are generated only from grounded context and never from generic placeholders.

Notion relationship records remain a knowledge/work projection, not the transactional runtime. Relationship state and outcomes flow into the core; decisions and statuses are projected back to Notion.

## 12. Cockpit

The cockpit becomes a consumer of the unified action queue rather than implementing its own independent ranking logic.

The primary screen is `Vandaag`, showing a bounded number of actions with:

- person/company/content
- why now
- channel
- next action
- evidence
- proposed copy when grounded
- expected value / priority
- open-source action
- done / skipped / outcome controls

Feed, DM, connections, content/blog and learning screens are filtered projections of the same canonical state.

## 13. Outcome closure

Every action must eventually resolve to an outcome or an explicit expiry.

Examples:

- executed
- skipped
- no response
- reply received
- meeting booked
- offer created
- order won
- revenue booked

Outcome recording immediately feeds the learning layer and can change the next decision for the same relationship, topic, channel or content pattern.

## 14. Health, failure and recovery

Failures are also closed loops:

`DETECT -> FINGERPRINT -> CONTAIN -> ROOT CAUSE -> FIX -> VERIFY -> RE-ENABLE -> READBACK -> LEARN -> PREVENT`

The system maintains health evidence for:

- event ingestion freshness
- adapter freshness
- decision queue age
- unresolved action count
- outcome closure rate
- learning freshness
- failed writebacks
- daily-loop completion

Failing adapters cannot silently produce empty success. Missing evidence produces a degraded state with an explicit reason.

## 15. Security and privacy

- Supabase runtime tables remain private by default with RLS.
- Service-role credentials never ship to Chrome or public client code.
- Device/client access uses scoped tokens or an equivalent restricted mechanism.
- Raw interaction data is minimized to what is needed for the commercial loop.
- No auto-send for DMs/comments/messages in the initial unified-core release.

## 16. Migration strategy

The migration must avoid a hybrid permanent architecture.

1. Preserve current production paths as rollback while the unified core is built.
2. Extend the Supabase v96 runtime into the canonical shared event/learning model.
3. Point Buffer/social into the core.
4. Point blog/SEO/website observations into the core.
5. Point LinkedIn feed/DM/connections into the core.
6. Switch cockpit reads/writes to the unified action/outcome APIs.
7. Project resulting state to Notion.
8. Run live cross-channel canaries.
9. Remove Make and redundant independent learning routes from the critical path after proof.

## 17. Release gates

The unified core is not considered live until these gates pass:

- schema/security contract tests
- idempotency tests
- DM no-context fail-closed test
- post no-context fail-closed test
- channel evidence policy tests
- cross-channel learning test
- revenue outcome priority-effect test
- bounded daily queue test
- Buffer/social ingestion test
- blog/SEO event ingestion test
- Notion projection test
- cockpit action/outcome integration test
- daily-cycle idempotency test
- degraded-adapter health test
- production health readback
- production event -> decision -> action -> outcome -> learning -> next-decision canary

For Chrome-specific LinkedIn behavior, a real local Chrome/LinkedIn readback remains mandatory before that adapter is marked verified.

## 18. Success criteria

The architecture is complete when:

1. all commercial/content channels share the same canonical core;
2. Make is absent from the critical path;
3. Powerhouse produces a useful bounded work queue every day;
4. every proposed action includes traceable evidence;
5. outcomes change future priorities;
6. learning can transfer across social, blog, outreach and sales where evidence supports it;
7. vanity metrics cannot override negative downstream commercial outcomes;
8. Notion and the cockpit show projections of the same runtime truth;
9. live canaries prove the closed loop end to end;
10. rollback and failure evidence are explicit and testable.

## 19. Non-goals for this release

- Fully autonomous message sending.
- Replacing Notion as the human knowledge interface.
- Claiming causal revenue attribution when only correlation is available.
- Unbounded AI experimentation without evidence, confidence and regression controls.

## 20. Implementation boundary

This design is one architectural program but should be implemented through a single coordinated plan with isolated modules and checkpoints. The core contracts are built first; adapters migrate one by one behind tests; production cutover happens only after cross-channel readback is proven.
