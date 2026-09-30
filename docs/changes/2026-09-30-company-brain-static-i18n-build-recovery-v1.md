# Company Brain static i18n production recovery

**Date:** 2026-09-30  
**Fingerprint:** `website|static-i18n|post-shell-final-string-coverage|v1`

## Root cause

The Company Brain release contained a static English cache patch, but the final site build changes public HTML after source authoring. Canonical shell projection and commercial finalizers split some source paragraphs and add exact UI/ARIA strings. With `STATIC_I18N_REQUIRE_CACHE=1`, the localized-route builder correctly refuses to publish when any final string has no deterministic English translation.

## Fix

The canonical patch `config/bg-static-i18n-en.d/20260930-company-brain-category-v1.json` now covers the exact final-artifact strings. Regression coverage checks those keys explicitly.

## Permanent rule

Public copy delivery must verify translation coverage after shell/CRO/final build transforms. Runtime translation may not mask a missing static production key. Terminal closure still requires protected main, successful Netlify production and public NL/EN readback.
