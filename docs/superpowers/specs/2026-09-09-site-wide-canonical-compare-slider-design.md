# Site-wide Canonical Compare Slider Design

**Date:** 2026-09-09
**Status:** Approved
**Approved scope:** all before/after compare sliders on Bedrijfsgeheugen

## Goal

Standardize every before/after slider on the site on one canonical interaction architecture that reaches the physical left and right edges exactly, works with touch/pointer/keyboard interaction, and preserves each slider variant's intended visual design and content.

The homepage “Sleep het verschil” interaction is the golden reference for the interaction experience. The implementation may normalize its internals, but must preserve the proven user-visible behavior rather than layering another independent gesture owner on top.

## Problem

Several successive fixes to the mobile compare slider still left real iPhone dragging stopping around 60% even though automated endpoint checks passed. The current site also contains overlapping ownership paths: generated bootstrap behavior and a separately loaded compare runtime can both create/control the same native range/rendering state. In addition, both `assets/compare-slider-runtime-native-range-v13.js` and `assets/compare-slider-runtime.js` currently resolve to the same implementation, making ownership and cache/version intent ambiguous.

The core failure pattern is architectural: automated tests have primarily assigned a numeric slider value directly, while the reported defect occurs in the physical gesture-to-value path. Therefore the site needs one interaction owner, explicit adapters, and physical-coordinate regression tests.

## Canonical Architecture

### 1. One normalized state

Every compare slider has one normalized numeric value from `0` through `100`.

- `0` means the divider is exactly on the slider's physical left edge.
- `100` means the divider is exactly on the slider's physical right edge.
- Intermediate values are linearly mapped across the slider's physical interaction width.
- No hidden endpoint snapping or bounds such as 8–92, 6–94, 30–70, or 40–60 are allowed.

The normalized value is the only source of truth for visual rendering. Handle width, knob width, CSS transforms, and clipped-layer dimensions must never be used to derive the value.

### 2. Exactly one interaction owner

A compare slider may have exactly one owner for pointer/touch/keyboard input. Legacy gesture listeners, generated bootstrap interaction listeners, duplicate runtime listeners, pointer-capture owners, or a second hidden range owner must not compete for the same component.

The canonical engine owns input transport. Variant adapters own presentation only.

The implementation must expose an explicit version/ownership marker so tests and production readback can prove that one canonical engine is active.

### 3. Golden-reference interaction behavior

The interaction behavior must match the homepage slider that users can drag successfully:

- direct manipulation across the intended full slider interaction zone;
- continuous movement from physical left to physical right;
- no artificial dead zone at either edge;
- a stable visible divider/knob that follows the normalized value;
- touch/pointer interaction that does not depend on the width of the visible handle;
- keyboard accessibility with a meaningful accessible name and standard endpoint navigation.

The white-knob/yellow-divider treatment stays where a variant currently uses it. Canonicalization is not a mandate to make every slider visually identical.

### 4. Variant adapters

The canonical engine discovers known compare slider variants and connects each one to a presentation adapter. An adapter may update:

- before/after clip paths or widths;
- divider position;
- decorative knob position;
- labels and readable-side behavior;
- variant-specific CSS custom properties.

Adapters cannot register their own drag/touch/pointer interaction owners. They receive the normalized value from the engine and render it.

Unknown compare slider markup is a release failure until it is either migrated to a known adapter or deliberately excluded with a documented reason.

### 5. Runtime ownership and assets

There must be one canonical, versioned production asset for compare interaction. The release must remove or neutralize duplicate interaction behavior from generator/bootstrap code and legacy runtime assets.

A compatibility alias may exist only if it delegates to the same canonical implementation without adding listeners or state. The production HTML should reference the versioned canonical asset so immutable caches cannot silently keep an obsolete gesture implementation alive.

### 6. Generator responsibilities

`tools/site-shell/fix-homepage-context-slider.mjs` may continue to supply layout/readability guards and generated markup required by the homepage, but it must not inject a second interactive controller.

It may mark/discover sliders and provide presentation CSS. Interaction initialization belongs to the canonical runtime only.

### 7. Accessibility

Every interactive compare slider must provide:

- an accessible Dutch label describing the comparison;
- a normalized `0..100` value;
- keyboard operation, including standard arrow behavior and physical endpoints via Home/End where the chosen input implementation supports it;
- a visible or browser-native focus path that does not make decorative handles independently focusable;
- decorative divider/knob elements excluded from the accessibility tree where appropriate.

## Site-wide Inventory Contract

The build/test system must inventory all compare-slider implementations across generated/public HTML and runtime source. Known selectors and structural signatures include the current `#compareSlider`, `.compare-slider`, `[data-compare-slider]`, and before/after sibling structure. The inventory must also scan for legacy compare gesture code and bounded-value signatures.

The inventory test fails when:

- a compare slider is not claimed by a known adapter;
- more than one interaction owner is present;
- an obsolete compare runtime is referenced as an independent implementation;
- a bounded legacy range or pointer-derived value path is reintroduced;
- a new slider variant appears without an explicit adapter/test case.

## Interaction Mapping

For pointer/touch-coordinate driven interaction, the value is calculated from the actual slider interaction rectangle:

`value = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)`

The physical left and right boundaries are authoritative. Any internal thumb inset or decorative knob width is presentation-only and cannot alter endpoint mathematics.

If the canonical implementation uses a native range as an accessibility/control primitive, the visible position must still be rendered from normalized state rather than native thumb geometry, and the physical-coordinate regression must prove the full edges are attainable.

## Responsive Readability

Current content readability behavior is preserved. On narrow layouts a variant may selectively hide the clipped copy on the nearly invisible side, but that rule is a presentation adapter concern and must never clamp or rewrite the normalized slider value.

No compare slider may cause horizontal viewport overflow as a consequence of canonicalization.

## Testing Strategy

### Static/site-wide inventory

A deterministic test scans the relevant HTML/generator/runtime sources and enumerates every known compare-slider variant, its adapter, and its runtime owner. It rejects duplicate owners, obsolete runtime references, hidden bounds, and unknown variants.

### Unit/runtime contract

Tests cover normalized clamping, physical-coordinate-to-value mapping, exact `0`/`100` rendering, adapter output, and ownership idempotency. Re-running initialization must not add a second owner or duplicate interactive controls.

### Browser interaction regression

Browser tests must exercise the real interaction path instead of only assigning `range.value` directly. For each representative slider variant and responsive viewport they drive physical coordinates at:

- the exact left edge;
- left edge + 1 px;
- the midpoint;
- right edge - 1 px;
- the exact right edge.

The assertions verify normalized state, visual divider position, clipping, interaction ownership, and absence of horizontal overflow. Touch-capable mobile emulation must exercise the same production event path used by the canonical engine.

Direct programmatic value-setting can remain as a renderer-level test, but it is not accepted as sole evidence that physical dragging works.

### Keyboard/accessibility regression

Tests verify the accessible label, value contract, focusability, arrows, and endpoint navigation. Decorative knobs/dividers must not become competing focus targets.

### Production readback

After merge and deployment, public readback verifies:

- the canonical versioned asset is served;
- representative pages initialize the canonical ownership marker;
- legacy/duplicate interaction owners are absent;
- endpoint and adapter markers match the released build.

Automated browser evidence proves the coded physical interaction path. Real iPhone finger operation is only claimed empirically after the user confirms it on the device.

## Migration Sequence

1. Inventory every current slider variant and existing interaction owner on the exact implementation base SHA.
2. Add failing inventory and physical-coordinate regression tests.
3. Implement the canonical engine and adapter contract from the golden-reference behavior.
4. Remove duplicate bootstrap/legacy interaction ownership.
5. Migrate each known slider variant while preserving its design/content.
6. Add accessibility and responsive regressions.
7. Run focused tests and the full Required release suite on one exact PR head SHA.
8. Merge only after required checks are green, then prove Netlify production serves the merge SHA or a verified descendant and perform public readback.

## Release Criteria

The change is releasable only when all of the following are true:

- every known site slider is inventoried and assigned to the canonical engine;
- exactly one interaction owner exists per slider;
- physical-coordinate tests reach exact `0` and `100` on representative mobile and desktop viewports;
- no legacy bounded endpoint logic remains active;
- keyboard/accessibility tests pass;
- no horizontal overflow regression is introduced;
- Required workflow succeeds on the exact PR head used for merge;
- the merged commit is present in production via an exact or ancestry-proven Netlify deployment;
- public readback confirms the canonical runtime and absence of competing interaction owners.

Real-iPhone physical success remains a final empirical check and must not be claimed before the user verifies it.

## Rollback

The migration must remain atomic enough to revert the canonical runtime/generator migration as one release if production readback detects a critical regression. A rollback must restore the immediately preceding known production commit; it must not reactivate multiple interaction owners piecemeal.

## Non-goals

This project does not redesign slider copy, colors, overall page layout, or unrelated interactive components. It does not convert every slider to an identical visual component. It does not treat a passing direct-value test as proof of real-device drag behavior.