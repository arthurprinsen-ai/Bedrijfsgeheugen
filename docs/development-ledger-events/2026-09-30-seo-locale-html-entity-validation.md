# 2026-09-30 — SEO locale HTML entity validation

Root cause: raw serialized `&amp;` values were compared with semantic `&` values in the locale/revenue map. This produced 12 false production build failures. Fix: decode HTML entities before comparing title/meta values. Regression added for `AI Model Comparison & Selector`, `M&A` and numeric character references.
