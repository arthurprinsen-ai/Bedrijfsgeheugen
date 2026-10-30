# Three-channel social CRO evidence — 30 October 2026

## Independent production baseline
- Existing daily source collector read tenant `bedrijfsgeheugen` only, omitting `canonical/linkedin_personal` from unified read-only diagnostics.
- Latest snapshots: Instagram 144 `composio-instagram/OBSERVED` (30 Oct), LinkedIn personal 51 `composio-linkedin/OBSERVED_PARTIAL_SCOPE` (30 Oct), LinkedIn company 25 `windsor-linkedin-company/PROVIDER_OBSERVED_LINKED` (last 27 Oct).
- Brand social-learning evaluations: 13, newest 24 Oct; canonical evaluations last 19 Sep. Only one historically recorded canonical learning application; no proven continuous application on the next post.
- 48-hour provider-aligned samples on clearly owned posts in the last 60 days: Instagram 7, explicitly tagged company 0, explicitly tagged personal 4. An additional 15 LinkedIn samples belong to 58 legacy brand-tenant posts with NO_CHANNEL and must not be counted as company performance. This is NOT enough to conclude a current improvement on each channel.
- Seven-day CRO view: 4,347 human-flagged pageviews; zero observed CTA events. Zero commercial_leads and zero independently proven provider orders in 30 days. Pageviews are not users, attributed social traffic or orders.

## Fix inside the existing canonical workflow
- Extend existing read-only Content growth learning query to explicitly include canonical LinkedIn personal plus owned brand LinkedIn and Instagram, retaining tenant/channel separation.
- Capture the post's local NL publication day/hour and available topic/hook/format/CTA metadata; post-body quality is not verified by metadata alone.
- Compare only same-age independently sourced 48h ± 6h post snapshots, last 7 days vs prior 21 days. Minimum 5 valid post observations in each period **for every metric**; report INSUFFICIENT instead of invented increases. Distinguish views, impressions, reach, reactions, likes, comments, repost/shares, saves and clicks.
- Preserve independent permission and identity gates; do not claim identities of individual viewers or infer company affiliation. Public engager identity only where provider authorizes and lawful purpose permits.
- No second scheduler, publisher, platform fallback, automatically targeted DM, or confidence-threshold reduction. Existing hourly social evaluator and daily collector remain the owners.

## Outstanding proof obligations
1. Protected CI, merge, release and natural next daily collector readback must pass. A PR is not live proof.
2. Collect fresh provider observations in age-aligned windows for all channels. Personal LinkedIn reactions-only and provider report-date company metrics cannot be promoted to impressions or causal evidence.
3. Close decision -> applied learning ID -> real new post ID -> provider post metrics -> attributable website visit -> consented lead -> independent paid order. Unknown remains unknown.
4. Test hook/topic/CTA/format/day/hour one variable at a time with valid control and enough comparable observations; only promote verified commercial wins.
5. Connect the existing portaal metrics to the source-backed scorecard after the protected release and verify authenticated production browser readback.

Status: PR candidate only. No claim of rising KPIs, successful deploy, or closed commercial funnel.

## Integration update — same obligation / PR #5182
- Native owner-only `portal-v2/modules/andere-data.js` now includes social CRO channel panel; existing `netlify/functions/powerhouse-cro-other-data.mjs` reads the original two tenant-scoped source tables with independently gated REST reads, never a new source or cron.
- Pure `netlify/functions/_social-cro-funnel-projection.mjs` joins exact 48h±6h independently qualified provider snapshots. Existing `tools/content-growth/social-funnel-trend.mjs` is the only trend algorithm.
- The original `.agents/skills/powerhouse-continuity/SKILL.md` points to the new social CRO capability skill; `AGENTS.md` stays unchanged from latest main because the attempted protected rewrite was rejected; one incident fingerprint and original publisher/learning/Portal remain authoritative.
- Required replay: `tests/brain-three-channel-social-funnel-trend-v1.test.mjs`, `tests/brain-social-cro-portal-evidence-v1.test.mjs`, `tests/portal-cro-other-data.test.mjs`. Auth rule untouched; admin-only route must independently read back in production.
- Completion remains **CANDIDATE** until protected exact-head CI, protected main merge, exact Netlify READY SHA, authenticated portal browser API and natural workflow evidence. Commercial trend & order uplift **UNPROVEN**.

## Preflight provenance / main-epoch event correction — 30 October 2026

GitHub main moved from `5d8dcae8cb4549f9f9739182e0bf7ecf1a3fe69a` to `e7fe1aa39c0bc24aa3c1ed7b49bba6711bc01c31` via separate protected release #5188 (five developer-proof and SkillOps files). Exact GitHub diff/readback established **zero overlapping path names** with this obligation's 14 declared social CRO files. This branch was integrated without force through original main-first two-parent CAS `23ff3abfac4b321928376b47c48532c776ed6086`; all other-owner files were retained. PR base metadata and GitHub PR base both now specify `e7fe1aa39c0bc24aa3c1ed7b49bba6711bc01c31`. The first preflight on this integration received old GitHub event `PR_BASE_SHA=5d8dcae8...` and returned `SCOPE_CONTAMINATED` only because it compared against the old owner epoch. **Do not relax branch hygiene.** This append-only original-owner ledger change triggers fresh checks on the current exact GitHub base and head. No extra scheduler/publisher, no fake channel metrics, no changes to global duplicate, consent or independent provider proof.
