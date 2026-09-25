# Static i18n cache artifact drift recovery — 25 September 2026

## Problem
The canonical localized-route builder, offline cache validator, regression test and fail-closed learning were still present on main, but the authoritative English cache file `.cache/bg-static-i18n-en.json` had disappeared after later repository changes.

## Root cause
The cache was generated data but also a production authority. That dual role was not protected strongly enough against later cleanup or branch churn.

## Recovery
The exact previously validated cache from merged PR #2944 was restored. No translation was regenerated. Its JSON whitespace was compacted only to keep the material diff within delivery-admission processing limits.

Evidence:
- entries before and after: 7,707;
- original serialized size: 1,049,339 bytes;
- compact serialized size: 1,018,510 bytes;
- semantic content: unchanged key/value map.

## Prevention
The cache is an authoritative generated website artifact. Any future removal/replacement must update builder, validator, learning, documentation and delivery evidence in the same lineage. `--validate-cache` remains the fail-closed coverage proof.
