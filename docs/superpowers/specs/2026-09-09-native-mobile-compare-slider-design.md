# Native Mobile Compare Slider Design

## Goal
Replace the fragile custom pointer/touch compare-slider transport with one native HTML `input[type="range"]` that owns the canonical 0–100 position, while preserving the current visual before/after card, yellow divider, clipping and mobile readability behavior.

## Problem
The production slider has repeatedly remained visually around 60% on real iPhone Safari/Chrome despite numeric endpoint logic, pointer capture, explicit touch handlers and handle-offset fixes. The failure mode indicates that custom event transport and visual handle geometry remain coupled in ways that are not reliably reproduced by desktop/headless checks.

## Architecture
The compare component will have one interaction owner: a native range input with `min="0"`, `max="100"`, `step="1"` and the current split as its value. The range will be positioned absolutely over the full compare card and made visually transparent except for an accessible/native thumb hit target as needed. Browser-native WebKit range interaction will therefore own touch tracking, dragging, edge clamping and keyboard semantics.

The existing compare renderer remains responsible only for presentation. On `input` and `change`, it reads the native range value and applies the same value to `--bg-compare-split`, `--split`, before/after clip paths, the yellow divider position, mobile readable-side state and endpoint state.

No pointerdown/pointermove/pointerup, touchstart/touchmove/touchend, pointer capture, window-level drag listeners or clone-based gesture ownership are used for the compare slider after this change.

## DOM Contract
The canonical slider root remains discoverable through `#compareSlider,.compare-slider,[data-compare-slider]`.

The runtime ensures exactly one native control exists per slider:

```html
<input class="bg-compare-range" type="range" min="0" max="100" step="1" aria-label="Vergelijk huidige en gewenste situatie">
```

The input spans the entire slider rectangle (`inset:0; width:100%; height:100%`) and sits above decorative content. The existing `.compare-handle` is presentation-only and no longer participates in input geometry.

## Rendering Rules
`0` means the divider and clip boundary are exactly at the physical left edge. `100` means exactly at the physical right edge. Intermediate values are linear percentages of the card width. The native control's numeric value is the sole source of truth.

## Mobile Behavior
Safari and Chrome on iPhone both use WebKit, so native range interaction owns horizontal dragging. The mobile readable-side rule remains: `<=20` after, `>=80` before, otherwise normal split.

## Accessibility
The native range provides keyboard, focus and assistive-technology semantics with min 0, max 100, current value and a Dutch accessible label.

## Fallback and Ownership Cleanup
The homepage shell fixer must stop injecting a separate custom pointer fallback for the compare slider. Existing style/readability guards may remain, but independent pointer/touch drag code must be removed so there is no second owner.

## Testing
1. Static/runtime contract verifies a native range with min 0, max 100, step 1 and no compare-slider pointer/touch gesture listeners.
2. Browser test on mobile viewport sets the native range to 0, dispatches input, verifies split/divider 0% and endpoint start.
3. Same for 100% and endpoint end.
4. Browser test verifies the range bounding box spans the compare card width.
5. Existing homepage, SEO, shell and broad browser suites remain green.

## Release Criteria
Merge only when Required succeeds on the exact PR head SHA. After merge, Netlify production must be ready on a commit containing the merge. Public readback must confirm the deployed runtime contains the native-range version and no legacy compare gesture transport.

## Non-Goals
- Redesigning the card visual language.
- Replacing the comparison with buttons or a carousel.
- Changing copy, colors or unrelated homepage sections.
- Refactoring unrelated change-flow/runtime functionality.
