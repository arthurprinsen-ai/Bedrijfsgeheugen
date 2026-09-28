# Development ledger — Contextual Foresight Portal v1

Date: 2026-09-28
Obligation: BG-20260928-CONTEXTUAL-FORESIGHT-PORTAL-V1

## Problem

The predictive intelligence runtime was live, but most of its value was still invisible at the moment of decision. A view-model existed, yet the portal did not consistently project foresight into the executive cockpit, finance/scenario pages, roadmap/action context and trust/learning surfaces.

## Change

Added a reusable contextual foresight visual layer. It consumes existing tenant-scoped goal forecasts/scenarios and an authenticated aggregate prediction-quality endpoint. No forecast logic is duplicated in Portal V2.

## Controls

- no fabricated forecast when history is insufficient;
- forecast and what-if scenario are visually distinct;
- uncertainty band and evidence count are visible;
- prediction-quality metrics are shown only as operational evidence;
- authenticated API returns aggregate model-quality controls only;
- existing Company/Brain context remains the customer-specific authority.

## Regression

- `portal-v2/tests/foresight-context-ui.test.mjs`
- standard Portal V2 regression suite
- Required browser regression
