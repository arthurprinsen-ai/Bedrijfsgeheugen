# Change / incident / learning ledger — 29 October 2026

- **Obligation ID:** `powerhouse|agent-provenance-data-quality|20261029-v1`
- **Fingerprint:** `powerhouse|agent-evidence-data-quality-documentation-growth|v1`
- **Owner:** existing Powerhouse/Brain agent continuity + exclusive writer; no new executor.
- **Source:** 2026-10-29 direct Supabase readback of `public.powerhouse_cycle_events` for canonical tenant, last 24 hours.
- **Observed:** 1,587 cycle records, none with `payload.agent_id`, `payload.skill_version` or both `payload.before_metric` and `payload.after_metric`; SQL sales/channel materializations are not human/agent executions.
- **Root cause:** unproven in individual runtime producers; at least missing structured attribution in emitted event payloads. Do not infer specific agent failures.
- **Change:** extend the existing incident/Lean contract and chat-learning preflight so actor type, provenance, data gaps, readable documentation, portal proof and measurable PDCA are mandatory policy. Regression tests reject drift. This is source governance, not proof of runtime adoption.
- **Verification:** pending protected Required, Brain, CodeQL and subsequent exact-main readback. Test target: `node --test tests/brain-agent-evidence-contract-20261029.test.mjs`.
- **Prevention:** SQL rows never count as autonomous agent actions; UNKNOWN is not ZERO; no fictitious attribution; no green without independent runtime/outcome evidence.
- **Portal status:** human Notion handbook and System Map were updated with candidate/current truth; live portal runtime projection remains OPEN.
- **Next action:** instrument real canonical agent emitters via the existing writer; idempotent, tenant-scoped actor/skill and before/after event payloads or explicit unknown status; run authenticated tenant and portal readback; measure real business contribution.
- **Business outcome:** not yet verified; no new leads or revenue attributed to this policy.
- **Rollback:** revert the protected candidate only if regression evidence shows breakage; preserve incident facts and documentation history.
