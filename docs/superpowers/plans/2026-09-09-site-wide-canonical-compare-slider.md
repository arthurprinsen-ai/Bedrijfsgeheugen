# Site-wide Canonical Compare Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all competing before/after slider interaction implementations with one canonical site-wide engine that maps the physical interaction rectangle linearly to exact 0–100 endpoints while preserving each slider variant's presentation.

**Architecture:** One versioned canonical runtime owns pointer/touch/keyboard transport and normalized state. Variant adapters render the normalized value into clip paths, divider/knob position, labels, and responsive readability. Generator/bootstrap code may provide presentation markup/CSS but may not register a second interaction owner. A deterministic inventory gate rejects unknown or duplicate slider implementations.

**Tech Stack:** Vanilla browser JavaScript, HTML/CSS, Node.js `node:test`, Playwright Chromium, existing site-shell generators, GitHub Actions, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-09-site-wide-canonical-compare-slider-design.md`

## Global Constraints

- Work from a fresh branch based on the latest `main`; if `main` advanced after design commit `4b83449695b6ab31a07ce681a1dbeb41771a00fc`, carry the approved spec/plan onto that fresh implementation branch before code changes.
- Preserve existing slider copy, colors, content and visual variants unless a presentation change is strictly required for endpoint correctness.
- Exactly one interaction owner per compare slider. Do not keep bootstrap + runtime listeners in parallel.
- Normalized slider state is always 0–100. No 8–92, 6–94, 30–70 or 40–60 bounds.
- Physical pointer mapping uses the slider's own `getBoundingClientRect()` width and clamps only at 0 and 100.
- Visible handle/knob dimensions never participate in value calculations.
- Use a new immutable/versioned production asset, `assets/compare-slider-runtime-canonical-v14.js`; keep `assets/compare-slider-runtime.js` only as a byte-identical compatibility alias if existing internal tooling still requires it. Production HTML must reference the versioned asset.
- Do not claim real-iPhone finger success until the user confirms it on a physical iPhone.
- Every production change follows TDD: establish a relevant failing test, record the expected failure, implement the minimum fix, rerun green, then commit.
- Merge only after the required GitHub status succeeds on the exact PR head SHA. Verify Netlify production is on that merge SHA or a proven descendant before claiming live.

---

## Task 1: Establish a deterministic site-wide slider inventory gate

**Files:**
- Create: `tests/site-wide-compare-slider-inventory.test.mjs`
- Read/scan: `index.html`, generated public `*.html`, `tools/**/*.mjs`, `assets/**/*.js`
- Modify later only if needed: `tools/site-shell/fix-homepage-context-slider.mjs`

- [ ] Write `tests/site-wide-compare-slider-inventory.test.mjs` so it recursively scans repository-owned public HTML, site-shell generators, and compare runtime assets while excluding dependencies/build caches. Recognize the current structural signatures `#compareSlider`, `.compare-slider`, `[data-compare-slider]`, and a parent containing both `.compare-before` and `.compare-after`.
- [ ] Make the test emit an explicit inventory of source paths/signatures and fail when it finds: multiple independent compare runtime references, legacy pointer/touch owners outside the canonical runtime, bounded endpoint expressions, or compare markup that has no canonical-adapter marker/known structural adapter.
- [ ] Add an assertion that production-facing HTML/generator code references exactly one versioned canonical compare asset after migration and does not independently register `pointerdown`, `pointermove`, `touchstart`, `touchmove`, or a second range `input/change` owner.
- [ ] Run `node --test tests/site-wide-compare-slider-inventory.test.mjs` before implementation and record the expected RED caused by the current v13/duplicate bootstrap/runtime ownership.
- [ ] Commit the failing inventory test with message `test: inventory all compare slider owners`.

## Task 2: Replace direct-value-only evidence with physical-coordinate browser regression

**Files:**
- Modify: `tools/site-shell/homepage-context-slider-browser-check.mjs`
- Create: `tools/site-shell/site-wide-compare-slider-browser-check.mjs`
- Modify: `tests/site-shell-compare-slider-physical-edges.test.mjs`

- [ ] Extend the static physical-edge test first so it requires a canonical coordinate mapping function equivalent to `((clientX - rect.left) / rect.width) * 100`, endpoint clamping only at 0/100, and a unique ownership marker/version `canonical-v14`.
- [ ] Create `tools/site-shell/site-wide-compare-slider-browser-check.mjs`. It must discover all initialized compare sliders on each tested route, identify their adapter/variant marker, and drive the actual production interaction path at physical X coordinates: exact left edge, left+1px, midpoint, right-1px, exact right edge.
- [ ] Use Playwright pointer/mouse events for desktop and a touch-capable mobile context for mobile. Dispatch through the same event path that production listens to; do not set `range.value` as the gesture test.
- [ ] Assert at each coordinate: normalized value, `data-bg-compare-endpoint`, divider physical position, before/after clipping, exactly one ownership marker, no duplicate interactive control, and no document horizontal overflow.
- [ ] Preserve a smaller direct-value renderer test only to verify adapter rendering independently of transport.
- [ ] Run `node --test tests/site-shell-compare-slider-physical-edges.test.mjs` and the new browser check against a local/preview build; capture RED on the current v13 architecture because it does not expose/own the required canonical physical-coordinate path.
- [ ] Commit failing regression coverage with message `test: reproduce compare slider physical gesture endpoints`.

## Task 3: Implement the canonical interaction engine and adapter contract

**Files:**
- Create: `assets/compare-slider-runtime-canonical-v14.js`
- Modify: `assets/compare-slider-runtime.js`
- Preserve for compatibility but stop production references: `assets/compare-slider-runtime-native-range-v13.js`
- Modify tests from Tasks 1–2.

- [ ] Implement a single idempotent engine with `VERSION = 'canonical-v14'`, a canonical ownership marker such as `data-bg-compare-owner="canonical-v14"`, and one normalized state per slider.
- [ ] Implement slider discovery for the approved current signatures and assign each discovered slider an explicit adapter marker. Start with the structural before/after adapter used by the homepage and extend adapters only for inventory-discovered variants.
- [ ] Implement `clientXToValue(slider, clientX)` from the physical slider rect, clamped only to 0–100. Exact `rect.left` must yield 0 and exact `rect.right` must yield 100.
- [ ] Implement exactly one pointer/touch-capable transport. Prefer Pointer Events where available; provide only the minimum WebKit fallback required by actual browser support and ensure the fallback is mutually exclusive rather than additive. Pointer capture, if used, belongs only to this owner and is released safely.
- [ ] Keep one focusable accessible control/state surface with Dutch accessible name and 0–100 semantics. Home/End and arrows must update the same normalized state and renderer.
- [ ] Implement presentation adapters that update CSS custom properties, before/after clipping, endpoint markers, divider and decorative knob without deriving state from their widths.
- [ ] Preserve mobile readable-side presentation logic as an adapter concern, not a value clamp.
- [ ] Make repeated initialization and MutationObserver discovery idempotent: no duplicate listeners, ranges, dividers, or owners.
- [ ] Make `assets/compare-slider-runtime.js` byte-identical to `assets/compare-slider-runtime-canonical-v14.js` if the compatibility alias is retained.
- [ ] Run `node --test tests/site-shell-compare-slider-physical-edges.test.mjs tests/site-wide-compare-slider-inventory.test.mjs`; both must turn GREEN.
- [ ] Commit with message `feat: add canonical site-wide compare slider engine`.

## Task 4: Remove the homepage bootstrap as a second interaction owner

**Files:**
- Modify: `tools/site-shell/fix-homepage-context-slider.mjs`
- Modify: `tests/site-shell-compare-slider-physical-edges.test.mjs`
- Modify generated `index.html` only through the canonical production generator path, not by maintaining a divergent hand patch.

- [ ] Add/adjust a failing test proving `fix-homepage-context-slider.mjs` may inject presentation CSS/markers but cannot contain its own `range.addEventListener('input'...)`, `range.addEventListener('change'...)`, pointer/touch listeners, or an independent render function that owns normalized state.
- [ ] Change `RUNTIME_SRC` to `/assets/compare-slider-runtime-canonical-v14.js`.
- [ ] Delete the interactive `BOOTSTRAP_TAG`. If bootstrapping markup is still necessary, restrict it to static presentation/marker creation and leave all interaction/listener creation to the canonical runtime.
- [ ] Keep layout/readability CSS needed by current design, but ensure `.compare-handle`/`.compare-knob` remain presentation-only and can be rendered by the adapter.
- [ ] Run `node --test tests/site-shell-compare-slider-physical-edges.test.mjs tests/site-wide-compare-slider-inventory.test.mjs` and require GREEN.
- [ ] Run the production build command from `netlify.toml`: `node tools/bouw-powerhouse-auth.mjs && node tools/bouw-kennisindex.mjs && node tools/bouw-v18-production.mjs && node tools/apply-tabbladen.mjs && node tools/bouw-v18-views.mjs && node tools/bouw-v18-chrome-alles.mjs && node tools/prijzen-uit-de-homepage.mjs && node tools/bouw-release-evidence.mjs`.
- [ ] Re-run both tests after generation to prove the generator does not restore old ownership.
- [ ] Commit with message `refactor: remove duplicate homepage slider controller`.

## Task 5: Migrate every inventory-discovered slider variant

**Files:**
- Modify: `assets/compare-slider-runtime-canonical-v14.js`
- Modify only the source/generator files reported by `tests/site-wide-compare-slider-inventory.test.mjs` for non-homepage slider variants.
- Modify: `tests/site-wide-compare-slider-inventory.test.mjs`
- Modify: `tools/site-shell/site-wide-compare-slider-browser-check.mjs`

- [ ] Run the inventory test in reporting mode or inspect its failure output and enumerate every current compare-slider source/route and structural variant in the test fixture/expected manifest.
- [ ] For each discovered visual variant, add an explicit adapter identifier and a failing browser case before changing its production markup/runtime behavior.
- [ ] Migrate that variant to the canonical owner without changing copy/content/colors/layout beyond what is needed for correct interaction geometry.
- [ ] Remove variant-local drag/touch/pointer state and old bounded calculations once its adapter is active.
- [ ] Ensure each migrated variant reaches 0/100 from physical coordinates and remains usable at 320, 360, 390, 430, 768, 844 landscape, 1024 landscape, 1128 desktop, and 1440 desktop representative viewports where that route/layout is applicable.
- [ ] Re-run `node --test tests/site-wide-compare-slider-inventory.test.mjs tests/site-shell-compare-slider-physical-edges.test.mjs` and the site-wide Playwright regression after each variant; require GREEN before moving to the next variant.
- [ ] Commit migrated variants atomically with message `refactor: migrate all compare sliders to canonical engine`.

## Task 6: Accessibility, idempotency, and responsive regression hardening

**Files:**
- Modify: `tests/site-shell-compare-slider-physical-edges.test.mjs`
- Modify: `tools/site-shell/site-wide-compare-slider-browser-check.mjs`
- Modify: `assets/compare-slider-runtime-canonical-v14.js` only if tests expose a defect.

- [ ] Add failing browser assertions for keyboard arrows, Home=0, End=100, accessible Dutch label/value semantics, one focusable interaction owner, and decorative divider/knob excluded from focus/accessibility interaction.
- [ ] Add an idempotency test that invokes initialization/mutation discovery multiple times and proves listener/control counts remain one per slider.
- [ ] Assert resize/orientation changes keep the normalized value stable while recomputing only presentation geometry.
- [ ] Assert no horizontal overflow and preserve mobile readable-side behavior without rewriting the normalized value.
- [ ] Run focused tests and browser checks until GREEN.
- [ ] Commit with message `test: harden canonical compare slider accessibility`.

## Task 7: Full build and release-gate verification

**Files:**
- No intentional production changes unless verification reveals a defect; any defect fix starts with a new failing regression test.

- [ ] Re-run the exact Netlify production build command from `netlify.toml` on the final candidate SHA.
- [ ] Run `node --test tests/site-wide-compare-slider-inventory.test.mjs tests/site-shell-compare-slider-physical-edges.test.mjs` after the build output has been regenerated.
- [ ] Run `tools/site-shell/site-wide-compare-slider-browser-check.mjs` against the generated/preview site and save the console evidence showing each discovered variant reaches exact 0 and 100 through physical-coordinate interaction.
- [ ] Run the repository's existing Required-equivalent/local regression commands referenced by the current GitHub workflow. Do not infer success from unrelated green jobs.
- [ ] Search generated output for obsolete independent production references to `compare-slider-runtime-native-range-v13.js`, bounded range expressions, and duplicate compare interaction listeners; require none.
- [ ] Self-review the diff for unrelated changes and generated noise. Revert unrelated files before PR.
- [ ] Commit only if verification itself required tracked evidence/docs, using message `test: verify canonical compare slider release`.

## Task 8: PR, exact-head CI, merge, Netlify, and public readback

**Files:**
- GitHub/Netlify metadata only; no code change unless a failed gate produces a TDD-backed fix.

- [ ] Refresh `main` immediately before PR. If it advanced, verify ancestry/conflicts and integrate safely before claiming the PR is current.
- [ ] Open a PR from the implementation branch to `main` with the spec, inventory, TDD evidence, representative physical-coordinate results, and explicit statement that physical iPhone validation remains user-confirmed.
- [ ] Record the exact PR head SHA and wait for the required `test`/“Required test” context to succeed on that exact SHA.
- [ ] If any required job fails, diagnose root cause, add/update a regression test first, fix minimally, rerun, and restart exact-head verification.
- [ ] Merge only after exact-head required checks are green. Record the merge commit SHA.
- [ ] Verify `main` contains the merge and that Netlify site `fd527056-493a-4d8a-8125-d00370104fa3` reports production `ready` on the merge SHA or a commit whose ancestry proves it contains the merge.
- [ ] Perform public readback on `https://www.bedrijfsgeheugen.nl/` and every representative route discovered by the inventory. Confirm the canonical v14 asset/owner markers and absence of active legacy/duplicate owners.
- [ ] Report the exact merge/deploy evidence. State that automated physical-coordinate interaction is proven; ask the user to perform the final real-iPhone finger check before declaring the empirical iPhone defect closed.