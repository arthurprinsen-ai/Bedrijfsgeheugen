# Daily Content Revenue Loop Design

Date: 2026-09-15
Status: Design approved in principle; implementation pending final review

## Goal
Create one closed-loop content operating system for Bedrijfsgeheugen/Powerhouse in which calendar, Brain decisions, content generation, channel identity, publishing, delivery proof, metrics, learning, commercial outcomes and cockpit readback are one connected system. No Make and no parallel storage or duplicate orchestration.

## Existing production baseline
- `content_publication_obligations` is populated through 2026-12-31 for `linkedin_personal`, `linkedin_company`, `instagram`, and `blog`.
- `powerhouse_channel_decisions` and `powerhouse_content_artifacts` are empty for the forward period inspected from 2026-09-15 through 2026-12-31.
- Email and both LinkedIn article lanes are not yet part of the hard daily obligation model.
- Existing watchdogs currently cover only the four existing lanes.
- Existing supporting tables/views include `powerhouse_daily_runs`, `social_posts`, `content_operations_cockpit`, and existing content/blog/social workflows.

## Canonical lanes
The system has seven canonical lanes:
1. `linkedin_personal` — personal LinkedIn post
2. `linkedin_company` — Bedrijfsgeheugen company-page LinkedIn post
3. `instagram` — Bedrijfsgeheugen Instagram / Mira
4. `blog` — website article/blog
5. `email` — newsletter/commercial email
6. `linkedin_article_personal` — long-form article on personal LinkedIn
7. `linkedin_article_company` — long-form article on company LinkedIn

Every lane gets a daily calendar decision, even when that day is deliberately not a publish day for adaptive-frequency lanes.

## Publication cadence
### Hard daily publication lanes
These may not be skipped:
- LinkedIn personal post: 7 per week
- LinkedIn company post: 7 per week
- Instagram: 7 per week

A day is not successful until these lanes reach `LIVE_PROVEN` with external evidence.

### Adaptive-frequency lanes
These receive a decision every day but are not blindly published every day.

- Blog: baseline 5 per week, normally Monday-Friday. Weekend publication is allowed when the Brain detects a sufficiently strong search, market, campaign, news or revenue opportunity.
- Email: baseline 2 per week, maximum 3 per week unless a transactional/critical service message is outside this marketing loop. Extra sends require segment relevance, novelty and a positive expected-value decision.
- LinkedIn article personal: baseline 1 per week.
- LinkedIn article company: baseline 1 per week.

For adaptive lanes, a non-publish day must be represented by an explicit daily `HOLD`/`NO_PUBLISH` decision with reason, next planned publish date and campaign/topic linkage. Silence is never a valid state.

## Daily Brain cycle
The Brain runs once per day as the canonical decision maker and may rerun on material new evidence. It reads:
- existing content calendar and obligations
- prior posts, articles, blogs and emails
- Buffer/publication outcomes
- website analytics and SEO/search signals
- engagement and network signals
- lead, proposal, order and revenue outcomes
- company/competitor/opportunity intelligence
- experiment history and calibration data
- freshness, fatigue, duplication and channel-fit signals

For each of the seven lanes it writes exactly one canonical decision for the day into `powerhouse_channel_decisions` and, when publishing, a corresponding artifact into `powerhouse_content_artifacts`.

Decision states:
- `PUBLISH` — publish this lane today
- `HOLD` — intentionally do not publish today; adaptive lanes only
- `RECOVER` — lane should already have published but requires recovery

Daily social lanes cannot receive `HOLD`.

## Calendar model
`content_publication_obligations` remains the operational source of truth; no second calendar table is introduced.

The obligation synchronizer is extended to all seven canonical lanes and keeps a rolling horizon of at least 120 days. The current calendar through 2026-12-31 is backfilled for the three missing lanes immediately.

Each obligation stores or links:
- campaign/topic key
- intended cadence
- decision
- content/artifact identity
- scheduled time/window
- external delivery ID/URL
- metrics state
- commercial hypothesis
- experiment/calibration references
- next action and error state

## State machine
Canonical flow:

`CALENDAR -> DECISION -> CONTENT -> IDENTITY/MEDIA GATE -> DISPATCH -> PUBLISHED/DELIVERED -> LIVE_PROVEN -> MEASURED -> LEARNED -> REVENUE_OUTCOME -> NEXT_DECISION`

Operational statuses continue to use the existing publication ledger where possible. New semantics must remain backwards compatible.

Hard daily lanes are successful only at `LIVE_PROVEN`, `MEASURED`, or `LEARNED`.
Adaptive lanes are successful when either:
- publication reaches live/delivery proof; or
- an explicit policy-compliant `HOLD` decision exists with evidence.

## Channel identity and dispatch
Existing `channel-identity-hard-gate-v2` remains fail-closed.

Exact Buffer identities remain canonical:
- personal LinkedIn: `6a70381699afb44349f0fb35`
- Bedrijfsgeheugen LinkedIn company: `6a70381699afb44349f0fb36`
- Instagram bedrijfsgeheugen.nl: `6a70384d99afb44349f0fba9`

Instagram remains Mira-only. Personal Instagram stays blocked until an explicit personal account is connected.

No publish lane may infer or substitute a channel identity.

## Content coherence
The Brain chooses one or more daily commercial themes/opportunities, then derives channel-native content from the same evidence set.

The system must prevent simple cross-post duplication. Each artifact records its parent theme/campaign and its role in the funnel.

Example content cascade:
- blog builds depth/search authority
- LinkedIn personal post adds Arthur's human observation/experience
- company post gives market/expertise proof
- Instagram translates the idea into Mira-native daily-life content
- email converts the strongest relevant insight into a segmented CTA
- LinkedIn articles package durable thought leadership rather than repeating short posts

## Cockpit as control plane
`content_operations_cockpit` becomes the operational control plane, not just a view.

For each day and lane it must show:
- calendar obligation
- Brain decision and rationale
- topic/campaign
- artifact readiness
- identity/media gate status
- dispatch status
- external post/article/email/blog ID or URL
- live/delivery proof
- metrics freshness
- lead/order/revenue attribution
- learning/calibration status
- next action
- failure/recovery state

Daily cockpit headline metrics:
- required today
- published/delivered
- explicit holds
- failed/late
- live-proven percentage
- metrics-ingested percentage
- learning-complete percentage
- leads, proposals, orders and attributed revenue
- channel performance and experiment winners/losers

The cockpit must be capable of answering: what was planned, what actually happened, what worked, what generated commercial value, what the Brain learned, and what it will do differently next.

## Watchdogs and recovery
The existing daily watchdog expands to all seven lanes.

Rules:
- LinkedIn personal/company/Instagram: missing live proof after deadline => `FAILED`; never auto-convert to skip.
- Blog/email/LinkedIn articles: expected publish without proof => `FAILED`; planned non-publish is valid only with explicit `HOLD` evidence.
- No obligation record => failure.
- Decision without artifact when `PUBLISH` => failure.
- Artifact without correct channel identity => failure.
- Dispatch without external readback => failure.

Recovery attempts reuse the existing lane and obligation. No parallel retry record is created.

## Metrics and learning loop
Every published artifact gets measured on channel-appropriate metrics and mapped back to:
- topic
- hook
- format
- CTA
- audience/funnel stage
- timing
- campaign
- experiment

The learning layer must connect engagement metrics to commercial outcomes. A high-engagement post that produces no downstream value is not automatically preferred over a lower-engagement post that creates qualified leads or orders.

## Revenue calibration
The existing chain is reused:
`powerhouse_forecasts -> powerhouse_sales_actions -> powerhouse_sales_outcomes -> powerhouse_forecast_calibration`

Content decisions add evidence to this same revenue-calibration loop. No new forecast/outcome store is introduced.

The Brain updates expected value by channel, topic, audience, format, CTA and timing using observed outcomes and confidence/calibration quality.

## Experimentation
Every week the Brain should maintain controlled exploration, not only exploit historical winners. Tests may include:
- hook style
- emotional framing
- CTA strength
- post length
- visual vs text
- blog format/search intent
- email subject/angle/segment
- article thesis/structure
- posting time

Experiments must have explicit hypotheses and measurable success criteria.

## Forward calendar and rolling horizon
Implementation must:
- backfill all seven lanes from 2026-09-15 through 2026-12-31
- generate one daily decision row per lane
- preserve existing valid obligations
- maintain at least a rolling 120-day horizon after 2026-12-31
- never require manual calendar extension at year-end

## Failure semantics
The system is fail-closed.

A daily run is green only when:
- all 3 hard daily social lanes have external live proof;
- every adaptive lane has either external proof when due or an explicit evidence-backed hold;
- all expected content artifacts and decisions exist;
- cockpit readback agrees with the underlying tables.

Missing data is never interpreted as success.

## Implementation boundaries
- No Make.
- No parallel calendar, queue, forecast or outcome store.
- Extend existing tables/functions/workflows where possible.
- All production changes require migrations and regression tests.
- Production verification must include Supabase readback and external channel readback where applicable.

## Acceptance criteria
1. Seven lanes exist in the canonical obligation model.
2. Calendar coverage is continuous through 2026-12-31 and rolling 120 days forward.
3. LinkedIn personal, LinkedIn company and Instagram are mandatory daily live publications.
4. Blog baseline is 5/week with evidence-backed weekend overrides.
5. Email baseline is 2/week, max 3/week absent exceptional non-marketing cases.
6. Each LinkedIn article lane publishes baseline 1/week.
7. Every lane gets a daily Brain decision.
8. `powerhouse_channel_decisions` and `powerhouse_content_artifacts` are populated as part of the same loop.
9. Cockpit exposes plan -> action -> proof -> metrics -> commercial outcome -> learning -> next decision.
10. Watchdogs cover all seven lanes and fail closed.
11. Channel identity hard gates remain enforced.
12. Revenue learning reuses the existing forecast/action/outcome/calibration chain.
13. No Make or parallel storage is introduced.
14. Production is not called complete without end-to-end readback evidence.
