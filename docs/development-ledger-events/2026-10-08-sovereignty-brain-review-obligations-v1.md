# AI/data location → Brain governance obligations

- Obligation-ID: sovereignty-brain-review-obligations-20261008-v1
- Business goal: changes in one part of POWERHOUSE must trigger evidence-backed cross-domain review, including CSRD/ESRS.
- Reuse: public.tenant_data_sovereignty_change_impact_v1 immutable ledger; public.brain_obligations canonical operating plane.
- New implementation: one server-only SQL trigger and idempotent initial replay.
- Guardrails: tenant-bound identity, source event contract validation, null measured environmental impact, never automatically mark compliant, no new independent schedule.
- Validation: Brain regression `tests/brain-sovereignty-impact-obligation-v1.test.mjs`; SQL migration, production readback and authorized tenant change proof are pending at PR creation.
