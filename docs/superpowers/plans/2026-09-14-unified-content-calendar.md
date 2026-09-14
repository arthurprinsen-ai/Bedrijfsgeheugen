# Unified Content Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one daily cross-channel publication operation that guarantees a tracked blog obligation for every day from 14 September through 31 December 2026 and exposes planning, publication, live proof, measurement and learning status for all active channels.

**Architecture:** Keep `social_experiments` as the canonical adaptive calendar and project it idempotently into an operational obligation ledger. Reuse Buffer/social learning for social channels, the approved-central-blog/BG169 lane for blogs, and the existing Powerhouse daily runtime as the central read/orchestration surface. No new parallel calendar or direct-to-main blog publisher is introduced.

**Tech Stack:** PostgreSQL/Supabase migrations and RPCs, Supabase Edge Function (Deno/TypeScript), GitHub Actions YAML, Python blog publisher, Node/Python contract tests where already supported.

**Spec:** `docs/superpowers/specs/2026-09-14-unified-content-calendar-design.md`

## Global Constraints

- Calendar timezone is `Europe/Amsterdam` for day matching.
- Exactly 109 canonical blog obligations must exist for 2026-09-14 through 2026-12-31.
- Required channel set is `linkedin_personal`, `linkedin_company`, `instagram`, `blog`.
- Existing Buffer/channel-identity controls remain authoritative for social publication.
- Existing approved-central-blog candidate PR → BRAIN/BG169 → Netlify/public-proof path remains authoritative for blogs.
- Never equate workflow success with production/live proof.
- No direct push to `main` from the blog publisher.
- Copy remains adaptive near publication time; the calendar reserves experiments/obligations, not frozen prose.

---

### Task 1: Operational publication ledger and 109-day invariant

**Files:**
- Create: `tests/test_unified_content_calendar_contract.py`
- Create: `supabase/migrations/20260914093000_unified_content_publication_operations.sql`

**Interfaces:**
- Consumes: `public.social_experiments(tenant_id, experiment_id, calendar_date, target_channels, recipe, comparison_scope)`.
- Produces: `public.content_publication_obligations`, `public.sync_content_publication_obligations(date,date)`, `public.content_operations_cockpit`.

- [ ] **Step 1: Write the failing contract test**

Create a Python test that reads the migration as text and asserts: required channel literals exist; range starts at `2026-09-14` and ends at `2026-12-31`; the SQL includes a 109-row fail-closed invariant; uniqueness is `(tenant_id, publication_date, channel)`; and the cockpit view exists.

- [ ] **Step 2: Run the test and verify RED**

Run: `python -m unittest tests.test_unified_content_calendar_contract -v`
Expected: FAIL because the migration does not yet exist.

- [ ] **Step 3: Implement the migration**

Create the ledger with monotonic state protection, idempotent sync, canonical channel normalization that adds Instagram, 109 blog-obligation assertion and cockpit view. Seed/sync 2026-09-14 through 2026-12-31.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `python -m unittest tests.test_unified_content_calendar_contract -v`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add tests/test_unified_content_calendar_contract.py supabase/migrations/20260914093000_unified_content_publication_operations.sql && git commit -m "feat: add unified publication operations ledger"`

### Task 2: Runtime read/orchestration surface

**Files:**
- Create: `tests/test_powerhouse_content_operations_contract.py`
- Modify: `supabase/functions/powerhouse-runtime/index.ts`

**Interfaces:**
- Consumes: RPC `sync_content_publication_obligations(p_from date,p_to date)` and view `content_operations_cockpit`.
- Produces: `contentOperations` on `/daily` response and GET `/content-operations?from=YYYY-MM-DD&to=YYYY-MM-DD&channel=...`.

- [ ] **Step 1: Write failing source-contract test**

Assert the runtime calls the sync RPC during `daily`, exposes `content-operations`, and queries `content_operations_cockpit` with bounded filters.

- [ ] **Step 2: Verify RED**

Run: `python -m unittest tests.test_powerhouse_content_operations_contract -v`
Expected: FAIL on missing route/RPC call.

- [ ] **Step 3: Implement minimal runtime changes**

Add a helper that reads operations; invoke sync for the run date before recommendation work; include the day's rows in the daily return object; map the new route to read-only scope.

- [ ] **Step 4: Verify GREEN**

Run the new test plus existing Powerhouse source-contract tests if present.

- [ ] **Step 5: Commit**

`git add tests/test_powerhouse_content_operations_contract.py supabase/functions/powerhouse-runtime/index.ts && git commit -m "feat: expose unified content operations"`

### Task 3: Automatic exact-slug blog dispatch

**Files:**
- Create: `tests/test_daily_blog_dispatch_contract.py`
- Modify: `scripts/publish_approved_blog_v2.py`
- Modify: `.github/workflows/approved-central-blog.yml`

**Interfaces:**
- Consumes: existing eligible approved blog queue and existing exact-slug renderer.
- Produces: `--select-due-slug` command and a scheduled execution path that resolves one eligible exact slug before render.

- [ ] **Step 1: Write failing contract test**

Assert the workflow has a daily schedule, scheduled mode resolves an exact slug using `--select-due-slug`, and rendering is still called with that exact slug. Assert the Python selector reuses `get_rows()`/`queue_contract()` and emits no slug when nothing eligible is due.

- [ ] **Step 2: Verify RED**

Run: `python -m unittest tests.test_daily_blog_dispatch_contract -v`
Expected: FAIL because scheduled selection does not exist.

- [ ] **Step 3: Implement selector and workflow schedule**

Add `--select-due-slug` to `publish_approved_blog_v2.py`. It selects only from rows already passing the existing queue filters/contracts and returns the earliest due deterministic exact slug. In the workflow add a daily schedule and a pre-render slug-resolution step; manual exact-slug dispatch remains supported. If no eligible due slug exists, stop without rendering and surface `NO_DUE_BLOG` rather than fabricate/approve content.

- [ ] **Step 4: Verify GREEN plus existing blog tests**

Run the new test and existing publisher/repo-writer tests. Ensure `render()` still rejects an empty slug.

- [ ] **Step 5: Commit**

`git add tests/test_daily_blog_dispatch_contract.py scripts/publish_approved_blog_v2.py .github/workflows/approved-central-blog.yml && git commit -m "feat: automate approved daily blog dispatch"`

### Task 4: Delivery/outcome reconciliation contracts

**Files:**
- Extend: `supabase/migrations/20260914093000_unified_content_publication_operations.sql`
- Extend: `tests/test_unified_content_calendar_contract.py`

**Interfaces:**
- Produces: `public.record_content_publication_state(...)` RPC enforcing monotonic progression and live-proof evidence requirements.

- [ ] **Step 1: Add failing tests**

Assert SQL contains a state-rank guard, blocks `LIVE_PROVEN` without destination/evidence, and preserves `last_error`/recovery metadata for blocked or failed obligations.

- [ ] **Step 2: Verify RED**

Run the ledger contract test and confirm new assertions fail.

- [ ] **Step 3: Implement state RPC**

Add one controlled state-transition RPC instead of permitting callers to invent completion semantics. `LIVE_PROVEN` requires `canonical_url` or `external_id` plus non-empty evidence.

- [ ] **Step 4: Verify GREEN**

Run all three new contract test modules.

- [ ] **Step 5: Commit**

Commit the migration/test extension.

### Task 5: PR/release verification

**Files:** No production code additions unless a gate identifies a defect.

**Interfaces:** GitHub PR, existing required CI/BRAIN/BG169 gates.

- [ ] **Step 1: Run source-level test suite available in the branch**

At minimum run the three new unittest modules; run existing relevant blog/repo-writer/Powerhouse tests discovered in the repo.

- [ ] **Step 2: Compare branch to main**

Confirm only intended files changed and no direct-main publishing behavior was introduced.

- [ ] **Step 3: Open PR**

Open a PR from `feat/unified-content-calendar-2026` to `main`, documenting the 109-day invariant, channel set, automatic publisher behavior and proof semantics.

- [ ] **Step 4: Inspect required checks**

Do not merge while required checks are pending/red. Fix root causes rather than weakening gates.

- [ ] **Step 5: Verify production only after merge/deploy/live proof**

Production status may be claimed only when the merged SHA is served and live readback proves the intended runtime/database behavior. Until then report branch/PR state explicitly.
