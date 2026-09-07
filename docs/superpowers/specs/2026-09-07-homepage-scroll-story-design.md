# Homepage scroll-story interaction

## Scope

Repair the homepage section that starts with “Eén wijziging. Overal doorgewerkt.” so it behaves as one deterministic change-impact story instead of a set of loosely dimmed steps.

## Approved interaction

- Desktop: a sticky story stage with four deterministic states driven by scroll progress.
- Step 1: incoming AFAS/Microsoft 365/Exact signal remains the source state.
- Step 2: the cockpit visibly switches to context/impact relationships.
- Step 3: the cockpit visibly switches to concrete follow-up with ownership/status.
- Step 4: the cockpit shows readback/effect state.
- Clicking a story step or “Analyseer impact” uses the same canonical state setter and moves the sticky story to the corresponding scroll state.
- Completed steps remain readable; future steps are dimmed without becoming illegible.
- The floating cost widget is suppressed only while the desktop story is active so it cannot cover step 04.
- Mobile uses a non-sticky fallback with the same state content.
- Reduced-motion preferences disable non-essential animation.

## Build placement

The interaction is applied as a final homepage build step after the V18/page-policy projection, alongside the existing Platform/Expertise toggle wiring. This avoids a source-only patch being overwritten later in the production build.

## Regression contract

A dedicated test verifies final-pipeline membership, canonical state wiring, scroll frame bounding, clickable navigation, mobile/desktop split, reduced-motion handling, accessibility state and the floating-widget overlap guard.
