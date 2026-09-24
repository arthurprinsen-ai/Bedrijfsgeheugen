# Pricing visible-state regression contract — 24 September 2026

Three BRAIN tests still required the old source syntax that only toggled the `hidden` property. The production repair intentionally strengthened pricing state to synchronize `hidden`, inline `display`, `aria-hidden`, active class and keyboard focus state.

The tests now validate those stronger semantics rather than a historical implementation spelling. This prevents CI from pressuring the code back toward the weaker behavior that caused the live defect.

Production browser interaction proof remains the terminal source of truth.
