# Pricing mobile + toggle root-cause recovery — 2026-09-23

## Problem
The pricing page had two coupled failures on mobile: route/pricing tables were rendered as oversized card-like blocks, and the lifecycle/package/billing controls remained unreliable despite earlier click-hardening.

## Root cause
A legacy responsive CSS block applied `display:block` to every `table, thead, tbody, tr, th, td` on the page below 900px. That rule predated the new lifecycle and M&A matrices and unintentionally rewrote them too.

At the same time, `bg-pricing-neno-v1-js` and `bg-pricing-interaction-guard-v2` both owned the same controls. Duplicate event ownership made state transitions harder to reason about and test.

## Fix
- remove the page-wide table-to-card media rule;
- keep lifecycle/pricing matrices as native tables inside horizontal-scroll wrappers;
- remove the duplicate interaction guard and retain one canonical pricing controller;
- enforce `[hidden]` semantics for lifecycle panels and plan cards;
- keep touch targets usable on narrow screens.

## Prevention
Responsive rules must be component-scoped. Interactive controls must have one state owner. The pricing regression contract now rejects global mobile table-to-block CSS and duplicate pricing-controller patterns.
