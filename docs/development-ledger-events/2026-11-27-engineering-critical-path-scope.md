# Critical-path delivery and mixed-scope admission — PR #6199

Obligation: f5ce0355-1d4e-43d3-a9df-fd13a6855870

Candidate base: 5ce4c1e80d7a5342de43f106ccceffb4dcc217aa; original head: b3b5589b68129801d73cc1e787509a611fb3e139.

Root cause: Original admission event lacked obligation ID, lane, candidate type and base SHA; the candidate subsequently received those fields. Material source changes also require repository closure artifacts.

Change: critical-path-first ordering with deterministic tie breaking and conservative full Required selection for any unknown material scope. Existing bounded parallelism, conflict rules, single writer and required checks remain unchanged.

Evidence: [original failed admission](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45981402643/job/140445930372). PR description reports 20/20 local regression tests; fixture reports four to three waves. The two named test cases are present in the original commit diff. CodeQL and preview succeeded on the original head; Required did not. No production effect or applied learning is claimed.

Prevention: Compile authoritative metadata, exact changed paths and all three closure artifacts before first protected CI run; mixed known/unknown material paths fail closed to Required; prioritize longest dependency chains under existing capacity and conflicts.

Next: exact new head protected CI, authorized merge, independent production and learning readback; compare lead time and first-time-right to baseline.
