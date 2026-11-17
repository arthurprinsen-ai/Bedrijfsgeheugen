# Original Instagram daily Mira — source false-positive and channel leak prevention
Date 2026-11-17 · Existing P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232

## Existing issue
The newly merged business-friction classifier gave vendor release headlines a lower friction score (0.55) but still allowed eligibility based on the weighted total. With high provider evidence, freshness, personal relevance and originality weights, this could exceed the existing 0.72 acceptance threshold and yield a press-release-derived fictitious business problem. In the same original source radar, results from the two personal source slots with no classified personal topic could be assigned an unrelated business PH-P topic, defeating the original 6-business/2-personal editorial separation.

## Narrow, original-owner repair
Pure helper has an explicit `admissible:false` value for product-launch headlines, independent of score. The original row's eligibility requires this veto, as well as all existing gates (dated independent source publication within 45 days, source URL type, quality >=0.72, 90-day source/hash and 3-day topic novelty in original materializer). Eligible real operational MKB problems remain score-based. An unclassified personal news result is rejected inside the original 2-slot personal lane and never repurposed as an Instagram business signal. Record the actual reason in original source-intake evidence for next run learning. The same original eight search calls and existing sole scheduler, OpenArt producer, original Meta publisher and named ONE BRAIN consumer remain unchanged.

## Evidence and next proof
Regression: tests/brain-mira-real-business-friction-20261117.test.mjs. Protected Required/CodeQL -> merge -> exact Supabase Edge production source readback -> next existing natural radar run -> independent eligible dated source -> original immutable winner -> original media claim/Mira QA and canonical Meta ID/GET -> named ONE BRAIN PROCESSED and Heartbeat metric. No fabricated source, lower quality gate, paid ninth search or duplicate post. Code release is NOT a media or full-loop completion claim.
