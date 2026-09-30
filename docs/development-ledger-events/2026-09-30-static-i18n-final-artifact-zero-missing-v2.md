# Static i18n final-artifact zero-missing recovery v2

**Date:** 2026-09-30  
**PR:** #3439  
**Fingerprint:** `website|static-i18n|final-artifact-zero-missing|v2`

Exact production-source replay after all final website transforms exposed two residual cache misses that earlier list-based recovery did not cover. The fix adds the exact current Company Brain copy and the Bedrijfslek built-artifact contract label, while preserving `STATIC_I18N_REQUIRE_CACHE=1`.

Permanent prevention: every public-site candidate must validate the exact final artifact after all transforms and after every sync/rebase, with zero missing static English keys before production promotion.
