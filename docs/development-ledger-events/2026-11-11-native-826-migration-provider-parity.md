# 2026-11-11 — native provider versions 825/826 exact-source reconciliation

Fingerprint: `powerhouse|migration|native-second-version-source-lock-drift|20261111-v1`
Original owner and incident: #4198; related customer Portal #4215.

- Observed original Supabase production at 09:48:29 UTC: 826 distinct native applied version/name pairs, last 20261111093500 and 20261111094222 both `original_loop_assurance_fault_isolation_v1`; initial original Git main lock held 824.
- Independently confirmed: native second version `statements[1]` equals original protected SQL source byte-for-byte. The first version is represented as three provider statements; no provider history edited or relabeled.
- Repair phase 1: source-only exact migration mirror, existing continuity skill, negative regression, ONE BRAIN machine lesson and human change record. Immutable source lock stays at 824 during proposed migration admission; phase 2 is separate protected source-only 826/826 lock reconciliation, after phase-1 merge and independent provider proof. Does not alter any original live Supabase migration, function, cron, scheduler or publisher.
- Unknown historical dispatch cause remains OPEN for original ONE BRAIN owner; do not claim provider or customer handoff fixed from lock-only repair.
- Existing natural 15-loop control remains 8 GREEN/7 RED and 433 content handoffs OPEN; source closure is not commercial outcome closure.
- Acceptance: protected Required/backend/BRAIN/CodeQL + hosted preview, merge exact main, native provider/source lock 826/826 readback, unchanged 15-loop and scheduler active, original issue stays EVIDENCE_DUE where actual outcomes absent.
