# Personal LinkedIn creative learning — no business recipe contamination

Date: 2026-11-16. Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5913

## Verified root cause
The production writing-rule fix #5926 retired twelve obsolete business-founder instructions. Independently, the existing `brain/creative/revenue-content-intelligence.mjs` and `config/social-learning-engine.json` still described personal posts as `observational_business_standup` with commercial conversations, qualification, FOMO and an offer path. A personal brief built from business experiments could therefore violate the final personal source gate or produce a bad post.

## Same owner / bounded correction
The original creative recipe now demands an authentic, unused, verified and consent-safe personal-life source and cannot turn a business opportunity into an Arthur story. The original company lane remains commercial. The recipe NEVER grants publication permission. The original one publisher, independent final review, source revision, member identity, anti-duplicate gate, final SHA and provider readback remain the actual authority.

Learning config separates engagement-based personal signals from B2B conversion. Reaction-only counts (observed 12–14 November) do not establish a winning personal format, and unavailable reach/comments may not be invented. Keep existing social-learning executor and reject premature `LEARNED`.

## Verification
Dependency-free `tests/brain-personal-creative-learning-20261116.test.mjs` and original revenue-content test replay. Protected Required, CodeQL, main merge and exact natural-run consumer proof are required before calling this live. No post created, edited or deleted by this PR; existing personal 16-Nov provider post `urn:li:share:7528105907701063680` must never be resent to "repair" its style. Record any new error under original #5913; no new service or scheduler.

## Research replay — 2026-11-16 (external, not provider-authorized post evidence)

Primary platform source: LinkedIn, *How LinkedIn Is Improving the Feed to Show More Relevant, Authentic Professional Content*, 2026-03-12: https://news.linkedin.com/2026/ImprovingTheFeed . LinkedIn explicitly downranks recycled generic posts/engagement bait and discourages fake interactions. LinkedIn's member analytics guide: https://www.linkedin.com/help/linkedin/answer/a525196/view-analytics-for-your-posts-shared-posts-and-articles?lang=en — impressions, profile activity and social engagement may be available; never infer private account impressions from public reaction counts.

External observational studies:
- Flypost, 2026-10-13, 116,000+ posts across 2,400+ English-language B2B creators, compared within individual creators: first-person personal stories +33% reactions, images +35%, first-person openers +19%; opening questions and forced CTA formats underperformed. https://www.flypost.io/press/linkedin-study-2026/flypost-linkedin-study-release-D.pdf ; full page: https://www.flypost.io/learn/linkedin-algorithm-study-data . **Limits**: commercial publisher, English-language B2B cohort, model-labelled personal anecdotes with small human validation, not independently peer-reviewed, measured public reactions/comments not member impressions. Do not convert findings into "always use a photo" or "every opening starts with Ik".
- Metricool, 2026-04-14, 673,658 posts and 63,108 accounts, including personal profiles: https://metricool.com/linkedin-trends-study/ . Question posts show +77% comments in its cross-sectional sample. This does NOT prove an ending question causes better results for Arthur and conflicts with Flypost's within-author comparison. Keep questions optional.
- LinkedIn, 2026-03-13, https://news.linkedin.com/2026/authentic-content-and-conversations , and LinkedIn Help https://www.linkedin.com/help/linkedin/answer/a1340567/automated-activity-on-linkedin?lang=en: no unauthorized bots, scraping, engagement pods or automated comments.

## Original single-loop implementation

The earlier written-only style policy was NOT sufficient: `supabase/functions/_shared/personal-linkedin-editorial-contract.mjs` still made 130–200 words and a final question mandatory. Remove those obsolete rules, keep mandatory verified first-person source/unique event/voice, noncommercial and exact-final-hash review. Add precise repeated-distinctive opener, ending and multi-marker template veto in that same original editorial contract. The original `bg-pre-publish-review` now reads the last 20 ORIGINAL published personal artifacts (up to 45 days), passes them as verified historical context, and fails closed on a history lookup error; never accept unverifiable caller-supplied historical patterns. Preserve older negative last-mile and duplicate protections.

Source-led, short or longer posts can pass without a question. Allowed style choices include a one-scene observation, emotional moment, short narrative, a single vivid detail, self-deprecation, quietly ending without a question, or a natural question; **no required format rotation** and no forced engagement CTA. Do not take unapproved family/children data or private pictures from chat history and publish without verified source rights. Optional images only if original media ownership and consent are confirmed; never synthesize an Arthur-family photograph. No personal story => leave ORIGINAL obligation OPEN with source owner/next action (no invented or recycled story).

Existing original social-learning executor should compare AUTHORIZED personal post measurements at 24/48/72 hours only when readable; store format/source/structure, real comment depth, impressions where allowed, sample size, provider URL and evidence. Never claim a winning pattern based on a handful of reactions or change into a fixed template. No second scheduler, writer, automation or Buffer/Make fallback.

## Protected delivery truth

This change is a SOURCE_CANDIDATE until exact-head Required, CodeQL and Supabase provider-owned Preview, protected merge, original Supabase Edge deployment readback and next natural personal-provider publication/Brain ACK are proven. Previous candidate preview error `PREVIEW_BRANCH_UNASSOCIATED` on #5929 is a provider linkage defect, not a content or DB failure. Do not bypass the provider check; https://supabase.com/docs/guides/deployment/branching/github-integration documents that GitHub integration must have automatic branch matching. Existing project currently listed no preview branch for PR #5929. This step remains OPEN until re-associated, provider proof and protected merge.
