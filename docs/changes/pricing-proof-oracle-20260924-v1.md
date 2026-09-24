# Stable pricing production proof oracle — 24 September 2026

## Problem

The production snapshot correctly deployed and proved the exact production SHA, but its pricing content gate still depended on two obsolete literal strings. That prevented the new browser-level interaction proof from running even though those strings were no longer part of the stable functional contract.

## Root cause

The release oracle mixed two kinds of evidence:
- stable semantic contract markers and user-observable behavior;
- incidental presentation copy and markup shape.

The second category is brittle and can change without any functional regression.

## Change

The pricing content proof now checks only stable semantic markers for billing, plan groups, lifecycle routes and the exact pricing interaction runtime asset. The authoritative functional proof remains the production Playwright verifier that clicks the controls and validates the resulting state and English route.

## Prevention

Never use literal marketing copy or presentational heading text as the terminal oracle for an interaction contract when semantic attributes and browser-observable behavior are available. Copy can be tested separately as content/SEO, but it must not block functional interaction proof.
