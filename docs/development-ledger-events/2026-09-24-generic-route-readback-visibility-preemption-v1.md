# 2026-09-24 — Generic route readback visibility preemption

- Fingerprint: `generic-route-readback-visibility-preemption-20260924-v1`
- Production SHA observed: `d55043434174a50b5d495563cc307d38f2db84c2`
- Netlify deploy: `6ab53d697712e90008736a73`
- Failed readback run: `36018220027`
- Failure: generic route verifier timed out waiting for visible `body` on `/prijzen`.
- Fix: generic verifier waits for DOM attachment; specialized pricing verifier owns visibility/clickability.
- Closure: exact production SHA plus green specialized pricing/i18n browser interaction proof remains mandatory.
