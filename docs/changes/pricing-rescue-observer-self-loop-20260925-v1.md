# Pricing rescue observer self-loop — 25 September 2026

## Symptom

Production contained the pricing markup, the inline `ready-v3` assignment and the rescue script, but browser automation could not observe interaction readiness. The page renderer became effectively unresponsive after DOMContentLoaded.

## Root cause

The rescue runtime observed every `childList` mutation below `body`. Its own `syncFromDom()` rewrites price and period `textContent`, which itself produces `childList` mutations. Each mutation scheduled another microtask repair, producing a self-triggering loop.

## Repair

The observer now ignores ordinary text replacement and only schedules repair when newly added element nodes contain pricing controls/panels:
- lifecycle controls/panels;
- price tabs/groups;
- billing controls.

Terminal proof remains the production Playwright flow: lifecycle → group → billing → NL/EN round trip.
