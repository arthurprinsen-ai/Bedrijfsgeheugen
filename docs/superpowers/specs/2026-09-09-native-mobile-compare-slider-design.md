# Native Mobile Compare Slider Design

## Goal
Replace the fragile custom pointer/touch compare-slider transport with one native HTML `input[type="range"]` that owns the canonical 0–100 position, while preserving the current visual before/after card, yellow divider, clipping and mobile readability behavior.

## Problem
The production slider has repeatedly remained visually around 60% on real iPhone Safari/Chrome despite numeric endpoint logic, pointer capture, explicit touch handlers and handle-offset fixes. The failure mode indicates that custom event transport and visual handle geometry remain coupled in ways that are not reliably reproduced by desktop/headless checks.

## Architecture
The compare component will have one interaction owner: a native range input with `min="0"`, `max="100"`, `step="1"` and the current split as its value. The range will be positioned absolutely over the full compare card and made visually transparent except for an accessible/native thumb hit target as needed. Browser-native WebKit range interaction will therefore own touch tracking, dragging, edge clamping and keyboard semantics.

The existing compare renderer remains responsible only for presentation. On `input` and `change`, it reads the native range value and applies the same value to:
- `--bg-compare-split` and `--split`;
- before/after clip paths;
- the yellow divider position;
- mobile readable-side state;
- ARIA/value state exposed by the native input itself.

No pointerdown/pointermove/pointerup, touchstart/touchmove/touchend, pointer capture, window-level drag listeners or clone-based gesture ownership are used for the compare slider after this change.

## DOM Contract
The canonical slider root remains discoverable through `#compareSlider,.compare-slider,[data-compare-slider]` for compatibility with the existing homepage shell fixer.

The runtime ensures exactly one native control exists per slider:

```html
<input
  class="bg-compare-range"
  type="range"
  min="0"
  max="100"
  step="1"
  aria-label="Vergelijk huidige en gewenste situatie"
>
```

The input spans the entire slider rectangle (`inset:0; width:100%; height:100%`) and has a z-index above decorative content. The existing `.compare-handle` becomes presentation-only or is hidden on mobile; it no longer participates in input geometry.

## Rendering Rules
`0` means the divider and clip boundary are exactly at the physical left edge. `100` means exactly at the physical right edge. Intermediate values are linear percentages of the card width.

The renderer must not derive position from handle width, thumb width, pointer coordinates or transformed element dimensions. The native control's numeric value is the sole source of truth.

## Mobile Behavior
Safari and Chrome on iPhone both use WebKit, so native range interaction is preferred over custom touch event plumbing. Horizontal dragging belongs to the range itself; page scrolling remains available when the gesture begins outside the compare card.

The mobile readable-side rule remains:
- value `<=20`: show the after copy and hide the before copy;
- value `>=80`: show the before copy and hide the after copy;
- otherwise show the normal split state.

## Accessibility
The native range provides keyboard, focus and assistive-technology semantics. It exposes `min=0`, `max=100`, current value and a concise Dutch accessible label. Home/End and arrow behavior are left to the browser's native range implementation instead of reimplementing keyboard handling.

## Fallback and Ownership Cleanup
The homepage shell fixer must stop injecting a separate custom pointer fallback for the compare slider. The external runtime is the only compare interaction implementation. Existing style/readability guards may remain, but any fallback code that independently handles pointer or touch drag must be removed so there is no second owner that can overwrite the native value.

## Testing
Regression coverage must prove both structure and behavior:

1. Static/runtime contract test verifies a native `input[type="range"]` with `min=0`, `max=100`, `step=1` is created and no compare-slider pointer/touch gesture listeners remain.
2. Browser test on a mobile viewport sets the native range to `0`, dispatches `input`, and verifies the canonical split/divider is `0%` and the endpoint is `start`.
3. The same test sets it to `100`, dispatches `input`, and verifies `100%` and endpoint `end`.
4. The test verifies the range's bounding box spans the full compare card width.
5. Existing homepage, SEO, shell and broad browser regression suites remain green.

## Release Criteria
The change may be merged only when the Required workflow succeeds on the exact PR head SHA. After merge, Netlify production must be `ready` on a commit that contains the merge. Public readback must confirm the deployed runtime contains the native-range version and no legacy compare gesture transport. Real-device iPhone verification remains the final empirical check because the current tool environment cannot emulate a physical iOS WebKit finger gesture.

## Non-Goals
- Redesigning the card visual language.
- Replacing the before/after comparison with two buttons or a swipe carousel.
- Changing copy, colors or unrelated homepage sections.
- Refactoring unrelated change-flow/runtime functionality.
