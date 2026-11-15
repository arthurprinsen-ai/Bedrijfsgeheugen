# 2026-11-15 — original ONE BRAIN self-certified proof gap

- Root P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original source: `tools/outcome-obligation-runtime.mjs::evaluateOne` auto-inserted `OBLIGATIONS_COMPLETE` as `independent=true,accepted=true,exactProduction=true`, then reran `evaluateCompletion`, whenever this was the last missing evidence. This used caller-supplied `materialObligations`, including empty set, and could produce false `LIVE_VERIFIED`.
- Native production source SQL: 328 historical records with producer `OUTCOME_OBLIGATION_RUNTIME` and this exact flag combination (2026-09-16–2026-09-25). Historical legitimacy undetermined, never allege confirmed 328 frauds. Preserve immutable records; independent recheck pending original owner.
- Same original runtime now leaves `required_evidence:OBLIGATIONS_COMPLETE` open rather than manufacturing independent completion. Existing supervisor audit decision remains non-independent, accepted=false.
- Existing agent-reliability and agent-data-quality tasks + recovery-proof skill updated; negative tests for empty and caller-labelled VERIFIED material. No new executor, cron, sender, SQL migration, provider mutation or RLS change.
- Machine learning: `brain/learning/2026-11-15-no-self-certified-independent-completion-v1.json` with replay, shadow and security canary. Human: `docs/changes/2026-11-15-no-self-certified-independent-completion.md`.
- Required/CodeQL/generator/Netlify, protected source merge, independent production SHA/readback and eventual real original producer outcome still required. P0 remains OPEN until sourced outcomes proven.
