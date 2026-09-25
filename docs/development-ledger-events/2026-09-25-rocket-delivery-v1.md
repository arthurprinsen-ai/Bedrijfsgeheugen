# Rocket Delivery v1 — development ledger

Date: 2026-09-25
Obligation: rocket-delivery-v1-20260925

## Change

Consolidated the still-relevant queue/fan-out reductions from stale PRs #3086 and #3091 onto the current protected main lineage.

## Root cause

Multiple workflow entrypoints were capable of validating the same logical website or delivery change, while several main-push workflows ran for changes outside their functional domain. This multiplied runner demand and increased queue latency without adding independent production evidence.

## Prevention

Required test remains the canonical protected PR gate. Duplicate canonical-shell/V18 pull-request entrypoints are removed, post-merge workflows are path-scoped, CodeQL uses stable PR/ref concurrency identity, and Shared Agent Memory no longer runs on every main push.

## Evidence

Regression coverage:
- tests/delivery-ci-trigger-budget.test.mjs
- tests/delivery-github-pr-workflow-single-flight.test.mjs
- tests/delivery-main-push-fanout-budget-v1.test.mjs

Production safety remains exact-SHA/readback based and branch protection is unchanged.
