# Complete immutable English cache restoration — 25 September 2026

## Incident

Netlify could report the exact current `main` SHA while the committed base English cache was still incomplete. An offline reproduction of the production localization build reported **1,926 missing translations**, beginning with `Aanmelden — begin met inzicht | Bedrijfsgeheugen`. The browser proof simultaneously showed that `/en/prijzen` still exposed the Dutch pricing H1.

## Root cause

A complete cache had already been generated and offline-validated earlier, but that cache blob never became the canonical cache on protected `main`. Small canonical patch fragments such as the pricing H1 mapping were correct, but they could not compensate for an incomplete base cache.

## Fix

The proven complete immutable cache blob `0be053e0…` is restored as `config/bg-static-i18n-en.json` on the current-main recovery lineage. Existing canonical patch fragments remain in place and continue to override/extend that base cache.

## Terminal proof

The change is complete only after protected merge, exact-main Netlify publication and the production NL→EN→NL browser verification pass.
