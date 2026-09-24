# 2026-09-24 — static i18n provider fallback regression v2

Observed:
- Netlify production main SHA: `92ffad0a568d33679501f3562dfabe5dddd80452`;
- build failed in `build-localized-routes.mjs`;
- Anthropic returned deterministic HTTP 400 down to batch size 1;
- existing runtime i18n fallback was present but unreachable because build code threw first.

Repair:
- restore provider failure → runtime fallback;
- fail fast on deterministic 4xx;
- expose bounded provider error body for root-cause diagnosis;
- preserve `/en/*` route emission;
- keep production pricing/English browser proof as terminal gate.

Security:
- provider credentials remain secret and are never emitted.
