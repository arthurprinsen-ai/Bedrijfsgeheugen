# 2026-10-12 — portal production browser selector recovery
- Live public source: Portal V2 new five-step operating journey and customer evidence proof gate, Netlify SHA 51bdf9deec401c0f59e548a938f4b11542c1703d.
- Existing workflow manual readback 38236074462: 14 passing, 1 skipped, 1 failed because test selected hidden illustrative dashboard card instead of the canonical customer navigation.
- Recovery changes only `tests/integration/portal-v2-production-standalone.spec.js`: click stable canonical sidebar `data-nav-target`, preserving navigation, native route, no-legacy, accessibility and auth assumptions.
- No runtime change, no new menu, no release-identity bypass, and no reintroduction of fake customer results.
- New protected merge and an exact-source production readback are mandatory before declaring E2E green.
