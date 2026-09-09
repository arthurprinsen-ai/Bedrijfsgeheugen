# Native Mobile Compare Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom compare-slider pointer/touch transport with one native `input[type="range"]` that controls the full 0–100 card width and reaches both physical edges on iPhone.

**Architecture:** Keep the existing compare card and renderer, but make the native range the sole interaction owner and sole numeric source of truth. Remove compare-specific pointer/touch/clone transport from the canonical runtime and remove the independent custom fallback transport from the homepage shell fixer.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, Node.js `node:test`, existing browser regression harness, GitHub Actions, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-09-native-mobile-compare-slider-design.md`

## Global Constraints
- Native range must be `min="0"`, `max="100"`, `step="1"`.
- `0` must render exactly at the physical left card edge; `100` exactly at the physical right card edge.
- No compare-slider `pointerdown`, `pointermove`, `pointerup`, `touchstart`, `touchmove`, `touchend`, pointer capture, window drag tracking or clone-based ownership may remain.
- Preserve current before/after content, yellow divider, readability thresholds and unrelated change-flow runtime behavior.
- Merge only after Required succeeds on the exact PR head SHA; verify Netlify production readback after merge.

---

### Task 1: Lock the native-range contract with a failing regression test

**Files:**
- Modify: `tests/site-shell-compare-slider-physical-edges.test.mjs`
- Test: `tests/site-shell-compare-slider-physical-edges.test.mjs`

**Interfaces:**
- Consumes: `assets/compare-slider-runtime.js` as text.
- Produces: regression contract requiring `.bg-compare-range`, native range attributes and absence of legacy gesture transport.

- [ ] **Step 1: Replace legacy touch/pointer expectations with native-range expectations**

Require runtime text to contain `bg-compare-range`, `type='range'`/`type="range"`, `min=0`, `max=100`, `step=1`, `addEventListener('input'`, and `addEventListener('change'`. Require it not to contain compare-slider `touchstart`, `touchmove`, `touchend`, `pointerdown`, `setPointerCapture`, or window pointer drag listeners.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/site-shell-compare-slider-physical-edges.test.mjs`
Expected: FAIL because production runtime still contains custom pointer/touch transport and no `.bg-compare-range` control.

- [ ] **Step 3: Commit the red test**

Commit message: `test: require native compare range ownership`

---

### Task 2: Make native range the sole canonical interaction owner

**Files:**
- Modify: `assets/compare-slider-runtime.js`
- Test: `tests/site-shell-compare-slider-physical-edges.test.mjs`

**Interfaces:**
- Consumes: existing slider root and before/after/divider presentation nodes.
- Produces: one `.bg-compare-range` control per slider; `renderControlled(value)` driven only by native range numeric value.

- [ ] **Step 1: Implement minimal native range creation**

Inside `initSlider`, ensure exactly one input exists:

```js
var range = slider.querySelector('.bg-compare-range');
if(!range){
  range = document.createElement('input');
  range.className = 'bg-compare-range';
  range.type = 'range';
  range.min = '0';
  range.max = '100';
  range.step = '1';
  range.setAttribute('aria-label','Vergelijk huidige en gewenste situatie');
  slider.appendChild(range);
}
```

Position it across the full card with absolute `inset:0`, `width:100%`, `height:100%`, transparent visual track/background and z-index above presentation. Keep it operable by WebKit rather than hiding it with `display:none` or `pointer-events:none`.

- [ ] **Step 2: Remove custom gesture transport**

Delete compare-slider pointer/touch state and listeners, `applyFromClientX`, pointer capture, window pointer tracking and `takeCanonicalOwnership` cloning. Keep `collectSliders`, rendering and MutationObserver initialization.

- [ ] **Step 3: Wire native events to the renderer**

Initialize `range.value` from `initialValue()`. On `input` and `change`, call `renderControlled(Number(range.value))`. In `renderControlled`, normalize to 0–100, set `range.value`, CSS variables, clip paths, divider, readable-side state and endpoint state. Hide/de-emphasize the legacy visual handle so it cannot define geometry.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `node --test tests/site-shell-compare-slider-physical-edges.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit implementation**

Commit message: `fix: use native range for compare slider`

---

### Task 3: Remove the second interaction owner from the homepage shell fixer

**Files:**
- Modify: `tools/site-shell/fix-homepage-context-slider.mjs`
- Add/modify test: existing homepage shell fixer contract test that covers compare-slider fallback, or `tests/site-shell-compare-slider-physical-edges.test.mjs` if no dedicated test exists.

**Interfaces:**
- Consumes: generated homepage shell/runtime injection.
- Produces: style-only fallback guards plus external canonical runtime; no independent compare pointer/touch drag implementation.

- [ ] **Step 1: Add failing assertion against custom fallback transport**

Assert the shell fixer does not inject compare-slider `pointerdown`, `pointermove`, `touchstart`, `touchmove` or coordinate-to-percent drag code, while still injecting `/assets/compare-slider-runtime.js`.

- [ ] **Step 2: Run focused test and verify RED**

Run the relevant Node test file and confirm failure because the fixer still carries the legacy fallback.

- [ ] **Step 3: Remove only compare-slider interaction fallback code**

Preserve layout/readability CSS and external runtime injection. Remove the independent drag listeners/owner marker logic so the native range runtime is the only interactive implementation.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run both compare-slider and homepage shell contract tests.

- [ ] **Step 5: Commit cleanup**

Commit message: `fix: remove compare slider gesture fallback`

---

### Task 4: Add browser endpoint verification

**Files:**
- Modify/create the existing website browser spec covering homepage compare slider under `tests/integration/` or the repository's existing homepage browser-test path.

**Interfaces:**
- Consumes: deployed/local homepage DOM and `.bg-compare-range`.
- Produces: browser proof for 0%, 100% and full-width control geometry on mobile viewport.

- [ ] **Step 1: Add browser test for 0 and 100**

On a mobile viewport, locate `.bg-compare-range`, set value to `0`, dispatch `input`, and assert root endpoint `start`, split `0%`, divider at left. Repeat with `100` and endpoint `end`/split `100%`.

- [ ] **Step 2: Assert full-card range geometry**

Compare range and slider bounding boxes and require their widths to match within 1 CSS pixel.

- [ ] **Step 3: Run targeted browser verification**

Run the repository's targeted website browser command for the changed homepage route. Expected: PASS.

- [ ] **Step 4: Commit browser regression**

Commit message: `test: verify native compare endpoints in browser`

---

### Task 5: Release and production readback

**Files:**
- No production source changes unless a failing release check identifies a regression.

**Interfaces:**
- Consumes: exact featurebranch head SHA.
- Produces: merged main commit and Netlify production deployment containing the native-range runtime.

- [ ] **Step 1: Open PR against current `main`**

Title: `Replace mobile compare slider with native range`

- [ ] **Step 2: Wait for Required on exact head SHA**

Required must be `completed/success`; inspect failing jobs before any code change if red.

- [ ] **Step 3: Re-read PR before merge**

Confirm PR is open, mergeable and head SHA still equals the verified SHA.

- [ ] **Step 4: Squash merge using expected head SHA**

- [ ] **Step 5: Verify merge is contained in current `main`**

Fresh-read `main`; parallel work may advance it, but ancestry/content must contain the merge.

- [ ] **Step 6: Verify Netlify production**

Wait until a production deploy is `ready` on a commit containing the merge and the public runtime contains the native-range version, `.bg-compare-range`, `input`/`change` wiring and no legacy compare pointer/touch transport.
