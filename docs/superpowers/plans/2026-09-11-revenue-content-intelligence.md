# Revenue Content Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Brain/Powerhouse learning system with a deterministic cross-channel opportunity and creative experiment decision layer that optimizes toward orders and revenue.

**Architecture:** Add pure decision logic under `brain/creative`, extend the canonical creative dimensions/config, persist the extra experiment dimensions through the existing Supabase tables, and schedule experiment slots through 2026-12-31. Existing social/revenue learning and publishing remain authoritative for outcomes and readback.

**Tech Stack:** Node.js ESM, node:test, JSON contracts/config, Supabase/Postgres, existing Netlify/GitHub Actions Brain workflows.

**Spec:** `docs/superpowers/specs/2026-09-11-revenue-content-intelligence-design.md`

## Global Constraints
- Revenue/orders outrank engagement and reach.
- Exploration target remains 20% unless evidence changes it.
- Personal LinkedIn uses observational business stand-up as a default creative mode, not as every-post sameness.
- Final copy is generated near publication time from current learnings; calendar slots do not freeze copy months ahead.
- Missing metrics are unknown, never zero.
- Existing Brain/Powerhouse/Supabase/Buffer contracts remain authoritative.

---

### Task 1: Pure opportunity and creative decision model
**Files:**
- Create: `tests/revenue-content-intelligence.test.mjs`
- Create after RED: `brain/creative/revenue-content-intelligence.mjs`

**Interfaces:**
- Produces `rankOpportunities(signals, policy)`, `chooseDecisionMode(history, explorationTarget)`, `buildCreativeRecipe(input)`, `buildExperimentCalendar(input)`.

- [ ] Write tests for commercial ranking, latent-problem/FOMO scoring, 80/20 exploration, personal stand-up recipe, company proof/carousel recipe and full daily calendar coverage through 2026-12-31.
- [ ] Run `node --test tests/revenue-content-intelligence.test.mjs` and observe RED because the production module does not exist.
- [ ] Implement minimal pure model.
- [ ] Re-run focused test and confirm GREEN.

### Task 2: Canonical creative contract extension
**Files:**
- Modify: `brain/creative/learning-dimensions.json`
- Modify: `config/social-learning-engine.json`
- Create: `brain/contracts/revenue-content-experiment.schema.json`

- [ ] Add pain/FOMO/comedy/proof/offer/source-signal/commercial-hypothesis/experiment dimensions.
- [ ] Keep metric priority revenue-first and exploration 0.20.
- [ ] Validate JSON parse and contract test.

### Task 3: Supabase persistence migration
**Files:**
- Create: `supabase/migrations/20260911113000_revenue_content_intelligence.sql`

- [ ] Extend `bg_post_kenmerken` with the new creative/commercial dimensions using additive nullable columns.
- [ ] Add `recipe` JSONB and experiment/source attribution fields to `social_experiments` only where absent.
- [ ] Add indexes for experiment/status/date lookups.
- [ ] Apply migration to production Supabase and read back the schema.

### Task 4: Calendar and experiment seeding
**Files:**
- Create: `tools/content-growth/seed-revenue-content-experiments.mjs`
- Create: `data/revenue-content-experiment-calendar.json`

- [ ] Generate one deterministic daily slot from 2026-09-12 through 2026-12-31 for personal LinkedIn and a rotating company/blog experiment stream.
- [ ] Seed experiment families rather than frozen copy: observational comedy/emotion, diagnostic/FOMO, proof/case, carousel, SEO opportunity, offer ladder and authority/contrarian.
- [ ] Persist experiment families/calendar identity idempotently.

### Task 5: Existing-loop integration and release gates
**Files:**
- Modify only the smallest existing content decision entrypoint required after discovery.
- Create: `.github/workflows/revenue-content-intelligence.yml`

- [ ] Make daily decisioning consume current social/revenue learnings plus SEO/content opportunity inputs.
- [ ] Emit recommendations into existing `powerhouse_content_recommendations` with evidence and dedupe key.
- [ ] Keep Buffer as publication/readback authority and existing failsafe as empty-day recovery.
- [ ] Add CI focused test + JSON validation.
- [ ] Merge only after required CI is green and production/Supabase readback proves the new contract.
