# Portal V2 production readback recovery — 2026-10-01

Obligation: `portal-v2-production-readback-recovery-20261001`

Netlify production deploy `6abe4c249f07cb0008e14578` is ready and serves exact main SHA `4a4f1f3d8deb9aed23b0a168dd0140b04dce803d`.

The first production DOM readback exposed two verification defects rather than a Netlify publication defect:
- an integration test still expected the removed duplicate `.pvglobalnav`;
- the full-parity browser sweep used one-shot `domcontentloaded` navigation and timed out on an immutable deploy route.

The follow-up changes align the production readback with the canonical sidebar information architecture and add bounded retry/commit-first navigation for immutable Portal V2 route verification.

The learning record is also corrected to use repository test paths for canonical historical replay, so Powerhouse skill projection can validate it deterministically.
