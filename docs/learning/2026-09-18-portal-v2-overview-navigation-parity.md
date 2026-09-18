# Portal V2 overview/navigation parity — empty-state preservation

## Incident

The protected legacy overview requires the adoption curve, company/organisation state, CMMI maturity, blockers and progress to remain represented in Portal V2. Production DOM readback on PR #2004 proved that the implementation still collapsed these surfaces into a single fallback sentence when the customer profile had no maturity data.

## Root cause

The first parity restoration rendered the complete management surfaces only when profile maturity existed. That made structural parity data-dependent. A customer with missing or not-yet-loaded data therefore lost the very surfaces needed to understand what remains unknown.

## Permanent rule

Missing data changes **content**, not **surface availability**. Protected management models, navigation and decision surfaces must remain visible in populated, partial and empty states. When evidence is absent, V2 must show explicit states such as “Nog niet ingevuld”, “Nog niet bepaald” or “Onbekend”. It must never fabricate an adoption stage, CMMI score or blocker.

Fingerprint: `portal-v2-empty-state-surface-preservation-v1`.

## Regression contract

Production readback must verify:
- the complete five-stage adoption curve exists;
- “Stand van je bedrijf”, CMMI and “Waar organisatie staat” remain visible;
- zero or one current adoption stage is valid depending on whether customer maturity is known;
- the general V2 navigation remains usable across opened pages;
- exact-head gates, protected merge and main/production readback are required before LIVE & BEWEZEN.

## Terminal evidence

The recovery candidate is now **LIVE_AND_PROVEN**.

- Exact candidate head: `193ebfa4046d0049bed9f7f9f48d54cdd56fccf2`
- Required: success
- BRAIN delivery: success
- CodeQL: success
- Portal V2 Tests: success
- Portal V2 Production DOM Readback: success
- Portal V2 Live Preview: success
- Protected squash merge: PR #2008 → `84231d46cc2bb23db6da202edef4c40a8c963b05`
- Netlify production deploy: `6aacdac88a1b590008d3af85`
- Netlify production commit_ref: `84231d46cc2bb23db6da202edef4c40a8c963b05`
- Production state: `ready`

## Learning closure

The permanent Powerhouse rule is now closed: a protected management surface may never disappear merely because its customer data is missing. Empty state must preserve the complete decision surface and render unknown truth explicitly rather than inventing a value or collapsing the interface.
