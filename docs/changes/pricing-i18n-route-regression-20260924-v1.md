# Pricing/i18n nested-route regression — 24 September 2026

## Symptom

Production `/prijzen` still exposed **“Switching language failed. Try again.”** and `/en/prijzen` did not resolve, despite the earlier pricing/i18n release having been marked live.

## Root cause

The earlier repair in PR #2689 added explicit localized wildcard rewrites. A later change left only the locale-root rewrites and removed the nested rules:

- `/en/*  /en/:splat.html  200`
- `/nl/*  /nl/:splat.html  200`

The static localized build writes pages such as `en/prijzen.html`, so removing the wildcard rewrite breaks nested localized public URLs even though `/en` itself can still work.

## Repair

PR #2709 restores both wildcard rewrites on the current main lineage.

## Permanent prevention

A prior `LIVE_BEWEZEN` result is not permanent truth. When production later regresses, current main and current production routing must be re-read. Public i18n proof must include a nested localized route such as `/en/prijzen`, and route mutations must preserve the wildcard invariant.
