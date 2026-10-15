# 2026-10-15 · Foresight tenant-scored signal drivers v2

- Obligation: powerhouse-contextual-foresight-4420; follow-on to merged PR #4423.
- Fingerprint: powerhouse|portal-v2|tenant-scored-signal-drivers|v2.
- Existing-state-first: reused authenticated `/api/portal-ondernemersdata`, existing EU tenant overlay, existing Portal V2 scenario studio and Omgevingsradar.
- Human interaction: explicit signal-loading control; no unsolicited provider calls from the scenario slider.
- Prevention: global/canonical source signal never automatically tenant impact; only tenant-specific, scored, fresh company overlays qualify. No impact-to-forecast numeric conversion.
- Tests: `portal-v2/tests/foresight-signal-drivers.test.mjs`; canonical harness `tests/brain-foresight-signal-drivers-canonicalization.test.mjs`.
- Release status: source candidate; no live claims or simulated receipts before protected release and authenticated production readback.
