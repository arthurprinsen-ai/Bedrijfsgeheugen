# 2026-09-25 — NL/EN exact-main production drift recovery

Observed:
- production deploy `6ab66b7bb3dd8b0008d0c2a1` served commit `f45ad02f8f719958c00b7ff8e39e3ca2104353b1`;
- protected main had already advanced to `e6b9369587ed0b7f31a68a50f2cfd360b8800a18` with later canonical i18n/cache/build-parity fixes;
- homepage, pricing and systems/koppelingen still exposed the public language-switch failure state.

Root cause:
- production/source drift: deployment readiness was treated as sufficient even though production did not equal current protected main.

Permanent repair:
- require exact production commit_ref == protected main SHA;
- require a fresh build after i18n build-environment changes;
- require homepage, pricing and systems/koppelingen NL/EN browser state-change proof before LIVE;
- persist the recovery in Brain, delivery documentation and continuity skill.
