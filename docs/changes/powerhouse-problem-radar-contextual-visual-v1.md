# Powerhouse Problem Radar — contextual visual intelligence v1

Date: 2026-09-25  
Fingerprint: `powerhouse-problem-radar-contextual-visual-v1`

## Change

Problem Radar intelligence is now projected visually and contextually into the Powerhouse portal instead of living only in the executive problem card or backend intelligence chain.

The same canonical `PH-Pxxx` lineage can surface on:
- Executive Cockpit;
- € Impact Engine;
- Next Best Actions & decisions;
- Monitoring & Learning;
- Evidence Health.

The projection shows only decision-useful context: impact label, evidence confidence, source/freshness context, segment, buying trigger, symptoms and the five priority dimensions (recency, scale, urgency, buying intent and Powerhouse relevance). External evidence is still benchmark/context and never becomes tenant fact without tenant relevance/evidence.

## Visual rule

Problem context is embedded where it supports the current task. It is not a new standalone dashboard, taxonomy or competing source of truth. Mobile presentation stays compact; the executive day-start remains primary.

## Evidence rule

“Waarom zegt Powerhouse dit?” remains the evidence drill-down. Visual emphasis must never imply stronger confidence, impact or urgency than the canonical evidence supports.


## Exact-main production recovery

Feature PR #2899 is protected merged as `5814f26d8c6855d30983a8b0572c3ee683242928`. The first Netlify provider readback after that merge still exposed the preceding production commit `5b49ad9ebe9ee280da1c1725458d2fcd910e79ad`.

The recovery therefore uses the existing canonical `Production Source Snapshot` workflow. No alternate deploy authority is introduced. The recovery is terminal only when provider readback proves a ready production deployment whose commit contains the contextual visual Problem Radar feature, with production/browser verification green.
