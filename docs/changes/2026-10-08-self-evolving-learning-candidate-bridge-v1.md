# Self-Evolving OS — verified learning to candidate bridge

Date: 2026-10-08
Obligation-ID: self-evolving-learning-candidate-bridge-20261008-v1

## Observed live gap

The existing Self-Improvement control reported 9 READY compiler items, 0 optimization candidates, and 1 open autonomous improvement. The existing cron `powerhouse-self-improvement-layer-v1` runs daily and remains the only owner of this bridge. These counts are a baseline observation, not proof of a released fix.

## Implementation

Extend `public.powerhouse_run_self_improvement_layer_v1(date)` in the protected migration supabase/migrations/20261008162000_self_evolving_learning_candidate_bridge_v1.sql. The existing compiler queue is read for material quality-event sources with production evidence and regression protection. Up to three fresh, source-key-deduplicated rows per cycle are written to `public.powerhouse_optimization_candidate_v1`. No new table, store, scheduler or autonomous provider dispatcher is created.

The rows are explicitly `candidate` and `review_required` under the existing BG169 authority. Confidence 0 means uncalibrated; numeric gains, ROI, causal effects and measurable outcomes remain unknown until independent evaluation. Candidates cannot auto-promote or execute. Re-running the same daily cycle is idempotent and may select the next unrepresented verified source.

## Evidence and closure

Regression: `tests/brain-self-evolving-learning-candidate-bridge-v1.test.mjs` and existing Self-Improvement suites. Merge into protected main and database migration readback are required before claiming active deployment. Operational readback must confirm generated candidates retain review-required status, no provider dispatch, and external value truth remains unchanged. Do not call this live before that readback.
