# Repair original Engineering innovation selection for proven parent PR (17 November 2026)

Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Production root cause

The original daily Self Evolution has now deployed continuous innovation delivery readback via https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5977. Its target code execution run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44166050762 completed the source selection with `selected=false` and skipped Codex. The original 14 sources are healthy but two still await protected Engineering builds. Original read-model candidate `55bb0754-355b-4940-aaea-aed7123e7e57` references **previous parent PR #5109**, not an already implemented child. Source action demands an admin-only System Map/read-model view distinguishing real done actions with executed_at from unsupported legacy execution stage events, preserving historical immutable data.

The selector in `scripts/brain/innovation-original-code-delivery.mjs` used `proposed_action.parent_pr` as an unconditional reason to drop every source task. This was a false negative for the distinct child; the original work remained `PLANNED` without a code candidate.

## Independent prerequisite proof and protected change

GitHub independently reports parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5109 merged on protected main as `722468c45cd3646755d79188a06dfb187468a946`. Native EU production confirms parent SQL migration `20261029122836 sales_cycle_execution_truth_guard_20261029` applied. The parent only changed existing SQL writer/migration plus metadata, whereas the child bounded allowed source scope is `platform/portal/powerhouse-existing-integration-read-model.mjs` or `portal-v2/control-plane-cockpit.js`.

The original Engineering selector now:
- Rejects all other action texts that contain PR directives and all parent references outside this exact already scoped component.
- For child `powerhouse-sales-cycle-execution-read-model`, performs **native** GitHub independent PR GET, asserts same repo, exact merged implementation PR #, `main`, unique original source, full ancestry to current main using native compare merge base and source-file disjointness.
- Holds the task on any provider outage, changed parent, unsupported revision, overlapping source, existing child PR, recorded no-change receipt, or owner/hash/rollback/consent mismatch.
- When fully eligible, passes immutable exact parent proof to the existing sandbox-only Codex work order and protected child PR body. Protected Required/CodeQL and existing rollout remain mandatory, as are real production and Heartbeat effect readback.

No new agent, timer, delivery queue, table or provider sender is created. This is a one-component scoped recovery, NOT a universal code permission expansion or a claim that the child was built.

## Verification, rollback and outcome

Run new source-negative regression `tests/brain-innovation-proven-parent-child-source-20261117.test.mjs` plus original implementation selector tests in the original workflow preflight, then protected CI/CodeQL and source merge. After merge, dispatch `execution_scope=original_code_recovery` via the existing workflow only once after checking prior runs. The original child remains `PLANNED/OPEN` until actual original provider proof, independent deployed SHA, baseline/holdout and commercial/financial effect and Heartbeat learning. Rollback with protected source-only revert of the selector and workflow test step, preserving all original historical Brain records.


## 24 November — residual original-owner recovery

Protected #5981 already implemented the original historical-parent selector. Preserve the current selector, methods and KPI contracts. The remaining native ancestry check uses the exact parent/main comparison; native readback for #5109 confirms ancestor equality. Original writer run 45437381849 built #6153 but admission run 45438546408 failed semantic_learning because explicit prevention was missing. Reuse the same canonical material closure validator in the original writer before opening any candidate PR, with negative tests for missing prevention/evidence/ledger and divergent ancestry. No duplicate selector or scheduler, no provider mutation, no effect or production claim. Rollback through protected revert.
