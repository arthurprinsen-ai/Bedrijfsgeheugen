# Contextual Intelligence Visibility Governance v1

Powerhouse intelligence is only complete when it is visible where a user can act on it.

## Canonical rule

**Material intelligence that changes a user decision must be projected into the relevant Portal V2 context in the same delivery lineage.**

This applies to:
- forecasts and foresight;
- risks and opportunities;
- benchmarks;
- recommendations and next-best-actions;
- Company Graph / System of Context insights;
- management-accounting intelligence;
- external intelligence;
- learning and outcome evidence.

## Required implementation pattern

Do not create a generic AI-insights dumping ground. The delivery owner must decide which portal context is operationally relevant and place a compact visual projection there.

Examples:
- revenue forecast → executive cockpit, financial context, businesscase;
- churn risk → customer/relationship context;
- capacity warning → operations and roadmap;
- valuation scenario → financing / exit;
- learning quality → outcomes / learning / trust surfaces.

## Truth and UX rules

- Never fabricate intelligence when evidence is insufficient.
- Show unknown/insufficient-evidence states explicitly.
- Distinguish facts, predictions, scenarios, assumptions and recommendations.
- Show uncertainty/provenance where materially relevant.
- Reuse canonical tenant-scoped runtime evidence.
- Avoid duplicate widgets across unrelated pages.
- Connect prediction → action → outcome where possible.

## Terminal criterion

A backend-only intelligence capability that materially affects a user decision is `WRITEBACK_INCOMPLETE`, not terminal green.
