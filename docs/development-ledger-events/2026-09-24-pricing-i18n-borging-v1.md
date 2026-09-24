# 2026-09-24 — pricing/i18n borging closure

User requested durable prevention after the pricing toggles and English switch had repeatedly been reported as fixed while the production symptom remained.

Observed live evidence showed the pricing page exposing the message `Switching language failed. Try again.`, proving the previous interaction proof was insufficient.

Borging delta:
- public language selection now routes to prebuilt localized pages;
- explicit `/en/*` and `/nl/*` Netlify rewrites added;
- production browser verifier added for pricing lifecycle, plan-group, billing and English-switch behavior;
- canonical learning strengthened with failed approaches, production evidence and explicit skill targets;
- continuity and delivery skills updated with a reusable interaction-proof rule;
- regressions added so these prevention markers cannot silently disappear.

Closure requires protected CI, merge, exact production SHA readback, successful production browser interaction proof and current skill projection.
