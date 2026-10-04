# Development ledger — pre-write obligation recovery

- Date: 2026-10-04
- Fingerprint: `powerhouse|prewrite-obligation|external-mutation-recovery|v1`
- Incident class: outcome lineage could be left non-terminal when an external mutation was blocked before write.
- Root cause: recovery durability depended too much on a mutation that could itself be denied.
- Correction: obligation/checkpoint must precede external writes; rejected pre-side-effect writes remain RECOVERY_REQUIRED in the same lineage.
- Blog rule: approved artifact remains open through protected GitHub publication and production canonical readback.
- LinkedIn company rule: read/ACL capability is not the write gate; genuine pre-create write denial is. Durable provider URN closes the side-effect and forbids replacement publication.
- Canonical projections: AGENTS.md, continuity policy, continuity skill, System Map, learning and regression test.
