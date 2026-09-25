# 2026-09-25 — Terminal NL/EN build/release recovery

Observed failures:
- Netlify build exited before i18n generation because an undocumented @netlify/identity internal bundle path was required.
- BRAIN lane exposed stale mobile-selector, billing ARIA and pricing-rescue cache-identity regressions.

Recovery:
- obsolete vendoring no longer blocks production;
- auth security guards remain mandatory;
- v18 mobile locale proof covers homepage, pricing and systems/koppelingen;
- ARIA regression is scoped to setBilling;
- pricing rescue cache identity is synchronized.

Terminal contract: protected merge → exact-main Netlify production → pricing interaction proof → NL→EN→NL browser proof on all mandatory routes → Brain/skills readback.
