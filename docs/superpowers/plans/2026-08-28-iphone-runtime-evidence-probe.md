# iPhone Runtime Evidence Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in, non-invasive runtime evidence probe that proves whether the hero video actually advances on the affected iPhone.

**Architecture:** A standalone static probe observes the existing hero video and exposes bounded deterministic evidence at `window.__BG_RUNTIME_EVIDENCE__`. The existing V18 build injects exactly one deferred script reference; no playback/controller behavior changes and no evidence leaves the browser.

**Tech Stack:** Browser JavaScript, Node.js build/test scripts, Netlify Deploy Preview.

**Spec:** `docs/superpowers/specs/2026-08-28-iphone-runtime-evidence-probe-design.md`

## Global Constraints
- Activate only for `bg-runtime-probe=1`.
- No outbound evidence request.
- No secrets/credentials/permissions changes.
- Do not change hero source, canonical controller, playback rate, opacity or navigation.
- Event history maximum: 80.
- PASS requires at least 5.0 seconds of playback advancement after `playing` and no media error.
- FAIL when target is missing, media errors, or after 12 seconds from first `playing` advancement is under 5.0 seconds.

---

### Task 1: Runtime probe contract

**Files:**
- Create: `assets/runtime-evidence-probe.js`
- Create: `tools/test-runtime-evidence-probe.mjs`

**Interfaces:**
- Produces: `window.__BG_RUNTIME_EVIDENCE__` evidence object with schema version 1.
- Consumes: existing DOM video `#heroBackgroundVideo`.

- [ ] **Step 1: Write the failing contract test**

Create `tools/test-runtime-evidence-probe.mjs` to read the asset as text and assert the activation query, evidence global, event cap, required events/verdict strings, and absence of playback/source mutations or outbound APIs (`fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket).

- [ ] **Step 2: Run the test and verify RED**

Run: `node tools/test-runtime-evidence-probe.mjs`
Expected: failure because `assets/runtime-evidence-probe.js` does not exist.

- [ ] **Step 3: Implement the minimal probe**

Implement an IIFE that returns immediately unless `new URLSearchParams(location.search).get('bg-runtime-probe') === '1'`. Observe the existing video, sample state every 500 ms, cap events with `events.splice(0, events.length - 80)`, set deterministic PASS/FAIL, update `window.__BG_RUNTIME_EVIDENCE__`, and render a fixed diagnostics panel with a copy button only in probe mode. Do not call video playback methods.

- [ ] **Step 4: Run the contract test and verify GREEN**

Run: `node tools/test-runtime-evidence-probe.mjs`
Expected: `Runtime evidence probe contract PASS`.

- [ ] **Step 5: Commit**

Commit message: `test: add deterministic iPhone runtime evidence probe`.

### Task 2: Inject probe without touching playback

**Files:**
- Modify: `tools/bouw-v18-preview.mjs`
- Modify: `tools/test-v18-preview.mjs`

**Interfaces:**
- Consumes: `assets/runtime-evidence-probe.js` from Task 1.
- Produces: generated `prototype-v18-stable.html` with exactly one `<script defer src="/assets/runtime-evidence-probe.js"></script>` before `</body>`.

- [ ] **Step 1: Extend V18 regression test first**

Add assertions to `tools/test-v18-preview.mjs` that the generated HTML contains exactly one deferred runtime probe script and that the canonical controller comparison remains unchanged.

- [ ] **Step 2: Run V18 build/test and verify RED**

Run: `node tools/bouw-v18-preview.mjs && node tools/test-v18-preview.mjs`
Expected: V18 regression failure because probe script is absent.

- [ ] **Step 3: Add the single build injection**

In `tools/bouw-v18-preview.mjs`, immediately before writing the generated HTML, replace `</body>` with `<script defer src="/assets/runtime-evidence-probe.js"></script></body>`. Guard against duplicate injection and throw if `</body>` is missing.

- [ ] **Step 4: Run all bounded tests and verify GREEN**

Run: `node tools/test-runtime-evidence-probe.mjs && node tools/bouw-v18-preview.mjs && node tools/test-v18-preview.mjs`
Expected: both contract and V18 QA PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: inject opt-in hero runtime evidence probe`.

### Task 3: Preview verification and release-gate evidence

**Files:**
- Modify: `docs/development-ledger.md` only after test/deploy evidence exists.

**Interfaces:**
- Consumes: exact branch SHA and Netlify immutable deploy URL.
- Produces: machine-readable evidence from physical iPhone; no automatic production promotion without PASS.

- [ ] **Step 1: Open PR and wait for exact-SHA Netlify preview**

Verify Netlify deploy `commit_ref` equals the exact PR head SHA and state is `ready`, with no secret-scan findings.

- [ ] **Step 2: Run immutable preview with probe mode**

Open the exact deploy URL ending `/prototype-v18-stable.html?bg-runtime-probe=1` on the affected iPhone.
Expected PASS criteria: panel and `window.__BG_RUNTIME_EVIDENCE__` show `verdict=PASS`, `advanceSeconds>=5`, no `error` event.

- [ ] **Step 3: Route evidence through shared learning**

For PASS or FAIL, write the material outcome through BG168/BG166/BG167 with exact SHA/deploy, verdict, events/failure reason and fingerprint `preview|hero-video|iphone-runtime-probe-v1`.

- [ ] **Step 4: Append repo ledger**

Record ERROR/RECOVERY/IMPROVEMENT or PRODUCTION_PROMOTION only according to actual evidence. Do not claim production green from build status alone.

- [ ] **Step 5: Production gate**

Only if physical-iPhone evidence is PASS and all existing preview/build gates are green, isolate/rebase the exact accepted changes onto current `main`, re-run tests, create a fresh exact-SHA preview, then use the existing production-promotion controller. Otherwise keep production on last-known-good.