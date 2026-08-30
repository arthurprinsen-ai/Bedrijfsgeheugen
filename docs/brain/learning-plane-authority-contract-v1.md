# BRAIN Learning Plane Authority Contract v1

Status: CANONICAL CONTRACT CANDIDATE
Scope: BG166, BG167, BG168, BG202, all current/future agents, chats, workers and automation callers.

## Purpose
Prevent learning-plane cost storms, identity spoofing, duplicate context rebuilds and stale contract drift while preserving durable learning.

## Canonical topology
Ordinary context read -> BG202 dedicated cache reader -> `team-context:latest`.
Material learning -> BG168 -> BG166 append-only/dedupe -> one bounded BG167 refresh authority -> BG167 projection/cache write.

Ordinary agents/chats MUST NOT use BG167 as a read path or directly authorize a rebuild.

## Authority invariant
`claimed-identity-is-not-authority-v1`

Caller supplied fields such as `agent_id`, `owner`, `role`, `source`, `mode` or similar payload text are descriptive metadata only. They MUST NOT independently grant privileged execution.

Privileged operations require a non-self-asserted authority signal controlled by the trusted owner path. For the BG166 -> BG167 rebuild path this currently includes a private refresh capability in addition to the canonical request semantics.

A caller that merely submits `agent_id=BG166` is unauthorized and MUST be rejected before Notion reads, projection building or cache writes.

## Cost invariants
- Old incident baseline: 23 BG167 runs in about 13 minutes, 192 credits, 128 operations.
- Direct/noncanonical BG167 call proof: 0 operations / 0 credits after boundary filtering.
- BG202 cached context read proof: 2 operations / 3 credits.
- Full BG167 rebuild currently costs about 9-11 credits and therefore MUST remain bounded.
- BG166 runtime reservation policy is one refresh reservation per UTC hour (`YYYYMMDDHH`, `window_seconds=3600`). Old labels/text saying 10 seconds or 1 minute are stale and non-authoritative.
- Material learning inside the same reservation window may persist but MUST NOT trigger another expensive BG167 rebuild.

## Runtime truth hierarchy
1. Runtime execution evidence / exact read-back.
2. Current scenario configuration.
3. Canonical machine-readable contract.
4. Human-readable labels/documentation.

A tool response saying `applied` is not sufficient evidence that a requested configuration mutation occurred. Read-after-write is mandatory.

Known Make connector regression: `set_module_config` may report applied while a requested module label remains unchanged. Treat labels as non-authoritative metadata unless read-back confirms them.

## Containment and recovery
If Make pauses the organization/team because an operations or data-transfer limit is exceeded, do not generate proof traffic or retry bursts. Preserve containment and mark runtime verification as blocked by a hard platform boundary.

BG166/BG167/BG168 may only be considered runtime green after all of the following are proven:
1. spoof request with `agent_id=BG166` but without valid capability stops before expensive modules;
2. canonical BG166 request with valid authority can perform exactly one permitted rebuild;
3. further material learning in the same UTC-hour window persists but coalesces refresh;
4. ordinary context reads resolve through BG202/cache and never invoke Notion/project/write modules;
5. measured executions, credits and operations remain materially below the old storm baseline;
6. no regression to self-asserted identity authorization.

Until those proofs exist, status is `CONFIGURATION_VERIFIED_AWAITING_RUNTIME`, not `PRODUCTION_GREEN`.

## Durable fingerprints
- `make|multi-agent-context-learning-credit-storm|2026-08-30-v1`
- `bg167|direct-call-bypass-coalescer|2026-08-30-v1`
- `learning-plane|bg167-boundary-bg166-hourly-coalesce|2026-08-30-v2`
- `bg167|self-asserted-caller-identity-bypass|2026-08-30-v1`
- `claimed-identity-is-not-authority-v1`
- `make-scenario-set-module-config-label-noop-v1`
- `learning-plane|bg167-cache-reader-split|2026-08-30-v1` (superseded identity: cache reader is BG202 scenario 7165044; old BG197 name collided with existing GitHub Repository Variable Admin scenario 7161428).

## Identity ownership
- BG166: append-only learning ledger writer + fingerprint dedupe + bounded refresh reservation owner.
- BG167: expensive shared-context projection builder; never ordinary read endpoint.
- BG168: material outcome/learning router; primary work remains fail-open relative to learning telemetry failure.
- BG202 (scenario 7165044): canonical cached shared-context read service.
- BG197 (scenario 7161428): GitHub Repository Variable Admin; never reuse this number for the cache reader.

## Regression behavior
Any future change that:
- allows self-asserted caller identity to grant authority,
- reintroduces direct ordinary BG167 reads,
- creates a second refresh owner/watcher,
- increases equivalent rebuild frequency beyond the bounded reservation policy,
- trusts stale labels over runtime config,
- or calls a containment-paused Make plane repeatedly for proof,

must be classified as `REGRESSION_OF_EXISTING_GUARD` and repaired by restoring this contract rather than opening an unrelated incident.
