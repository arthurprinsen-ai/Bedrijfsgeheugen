# Growth Intelligence V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist relationships and automatically calibrate prior predictions against real outcomes while strengthening company, white-space, attribution and concept-drift intelligence.

**Architecture:** Extend `platform/growth-intelligence-engine.mjs` and `netlify/functions/growth-intelligence-daily.mjs`; reuse canonical Supabase/Brain tables only.

**Tech Stack:** Node ESM, node:test, Netlify Functions, Supabase PostgREST, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-12-growth-intelligence-v2-design.md`

## Constraints
- No parallel CRM/graph/analytics/learning store.
- Prediction before outcome.
- Missing baseline/outcome is INSUFFICIENT_EVIDENCE.
- Signed offer is not realized revenue.
- Attribution: DIRECT/ASSISTED/INFLUENCED/UNKNOWN.
- Exploration target 25%.
- Graph/intelligence records preserve source lineage, confidence and freshness.

## Tasks
- [ ] RED tests for relationship records, company profiles, white-space, Brier calibration, confidence decay and attribution dedupe.
- [ ] GREEN pure intelligence functions.
- [ ] RED daily test for due prediction calibration and graph persistence.
- [ ] GREEN daily canonical reads/writes and obligation closure only with comparable evidence.
- [ ] Run engine/daily/syntax/regression tests.
- [ ] Open PR, require exact-head CI, merge exact green SHA.
- [ ] Verify main + production deploy identity + runtime canary/readback.
- [ ] Persist live Brain verification; leave tomorrow's real bootstrap OPEN until due.
