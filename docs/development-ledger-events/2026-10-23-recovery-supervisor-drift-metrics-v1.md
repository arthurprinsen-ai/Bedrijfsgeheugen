# Same-lineage Recovery Supervisor drift metrics
2026-10-23 | https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120
- Original source-only CAS fix: PR #4781, main c8a0800a4dc87436ec54e3de842539f428aa9a0c.
- Baseline: production run #39960974891, 49 drift classifications, 58 lease refusals, one permitted recovery dispatch.
- Change: same workflow emits bounded event file, one per-run GitHub artifact, no database or other writer.
- Required: exact-head protected Required + CodeQL, main source readback and actual supervisor artifact.
- Metric success is not protected release or customer value proof.
