# Known-error preflight contract

Purpose: prevent agents, chats and automation builders from rediscovering already solved platform/tool failures or creating duplicate capabilities during parallel development.

This file is machine-searchable by fingerprint, helper name, platform and scenario capability. It supplements the canonical BRAIN chat-learning preflight and must be consulted before material Make, GitHub, Netlify, Notion or portal mutations when the planned change touches matching helpers, modules or capabilities.

## Mandatory pre-mutation lookup

Before a material platform mutation:

1. identify platform, module/action, helper/expression, capability/outcome obligation and intended scenario/component id;
2. search shared Brain/Knowledge Base and repository learning for those names plus relevant error aliases/fingerprints;
3. if a proven fix/prevention exists, reuse it first;
4. if a known failed approach exists, it remains blocked unless fresh evidence proves the old root cause no longer applies;
5. immediately before creating a new scenario/component, refresh inventory again to catch parallel-agent changes;
6. if an equivalent canonical successor now exists, reuse or patch it instead of creating a duplicate;
7. only after this preflight may the candidate mutation/canary run.

A generic statement such as “shared context loaded” is not sufficient evidence. Preflight evidence must identify what platform/module/helper/capability was searched and which known-fix hit was reused or why no relevant hit existed.

## Known Make mapper helper failures

### `make|mapper|toJSON-not-found`
Aliases: `make-mapper-tojson-unsupported-v1`, `bg153|classifier-input|unsupported-toJSON`, `MAPPER_TOJSON_NOT_FOUND`.

Symptom: runtime mapping fails with `Function 'toJSON' not found!` even though the scenario blueprint saved successfully.

Root cause: `toJSON()` is not available in the relevant Make mapper expression context.

Required fix: construct non-trivial JSON payloads inside `code:ExecuteCode` with JavaScript `JSON.stringify`; the Make mapper transports the resulting string only. Prefer native object transport when the downstream module accepts it.

Blocked approach: do not reintroduce `toJSON()` in mapper expressions merely because the editor accepts/saves it.

Regression rule: a new API/body mapping must not contain `toJSON()` unless an exact current runtime canary proves that specific mapper context supports it.

Observed recurrence: at least three occurrences by 2026-08-30. Repeating this error is a knowledge-preflight failure, not a new unknown defect.

### `bg130|module2-mapper|exists-function-not-found`
Symptom: runtime mapping fails because `exists()` is used as an assumed Make expression helper.

Root cause: mapper configuration referenced an unsupported function name in that mapping context.

Required fix: perform presence/branching logic in a deterministic code module or use a verified native Make operator/function known to work in that exact context.

Regression rule: blueprint validation or active scenario status never proves mapper helper operability; execute the read-only branch and inspect the underlying Make execution.

## Knowledge-use failure

### `knowledge-preflight-missed-known-fix-v1`
Symptom: an agent reproduces a tool/platform error whose root cause and fix already exist in shared learning.

Root cause: preflight was too generic; the agent did not search on concrete platform + module + helper/error alias before mutation.

Required prevention: explicit known-error lookup before implementation. Repeated known errors increment the canonical recurrence/fingerprint instead of creating isolated competing truths.

## Parallel development / duplicate creation

### `parallel-agent-stale-inventory-duplicate-create-v1`
Symptom: a second scenario/component is created because inventory was checked only at task start while another agent created the canonical capability in parallel.

Root cause: stale inventory snapshot immediately before creation.

Required prevention: two-phase creation gate — initial discovery plus a fresh inventory/Latest Verified State/compatibility lookup immediately before `scenario_create` or equivalent component creation.

If an equivalent canonical capability exists, creation is blocked unless there is an explicit successor/new-version architecture decision.

Production example: canonical `BG 201 - Radar Heartbeat Stale Sensor v1` is Make scenario `7164254`. Duplicate scenario `7164500` was retired and must not be reactivated.

## Repository mutation governance

### `repository|manual-connector-write|default-main-bypass`
Symptom: a manual GitHub connector write can modify the repository default branch when `branch` is omitted, even while the intended delivery model requires candidate → tests → promotion.

Root cause: connector authorization proves permission to write but does not prove governed delivery; native GitHub main protection is a separate external control and may be absent.

Blocked approach: never use `create_file`, `update_file` or `delete_file` for a material change with branch omitted or `branch=main`, then treat a technically successful write or later CI on main as equivalent to candidate evidence.

Required prevention: create a non-main candidate branch from current main before the first material repository write, pass that branch explicitly on every connector mutation, bind RED/GREEN and integration evidence to the exact candidate SHA, and use only the governed promotion authority to move accepted work to main.

Evidence rule: governed repository delivery requires an explicit candidate branch, exact tested candidate SHA and authorized promotion/readback. Connector-write success alone is never sufficient production evidence.

## Incident state semantics

### `incident-open-selection-semantic-mismatch-v1`
`Auto Fixed = NO` does not mean an incident is open. A rollback to last-known-good or other verified recovery can close an incident without an automatic forward fix.

Open/closed classification must use the combination of recovery status, operational status, resolved timestamp and fresh runtime evidence. Audit/check-box fields are supporting evidence only.

## Entitlement/capacity boundary

### `notion-query-datasource-usage-limit-v1`
On Notion Query Data Source `usage_limit_reached`: do not immediately retry, do not autonomously upgrade a paid plan, and do not reinterpret the entitlement failure as missing data. Use read-only search/fetch fallback where semantically sufficient and retry the query only later when capacity is available.

## Completion rule

A learning item is structurally guarded only when all applicable layers agree: persistent Activity/Telemetry log, shared Brain learning, searchable knowledge/fingerprint, compatibility/current-state mapping and a deterministic regression/prevention rule. Historical evidence is retained; later canonical rulings supersede stale interim conclusions without deleting audit history.
