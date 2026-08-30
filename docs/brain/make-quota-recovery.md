# Make Quota Recovery Contract

This runbook captures the 2026-08-30 Make execution pause and the prevention rules learned from it. It is intentionally separate from transient chat state so agents can recover consistently after Make quota release.

## Runtime authority

Scenario-level configuration is not enough to prove execution availability.

Observed simultaneously:

- `scenario_get` returned `status=paused` while `isActive=true`.
- `scenario_activate` replied that the scenario was already active.
- `scenario_run` failed with: `Scenario cannot be run because its organization or team is paused. Resolve the exceeded operations or data transfer limit and try again.`

Therefore organization/team quota eligibility is a higher runtime authority than scenario activation state.

Canonical prevention rule: `organization-team-runtime-authority-v1`.

Never claim a Make scenario runtime-green from `isActive`, scenario status, activation response, or saved blueprint alone. Require an actual execution canary after the organization/team is execution-eligible.

## Stable scenario identity

Use immutable scenario ID as the canonical identity. Scenario names and BG aliases are mutable display metadata.

Example: scenario `7165044` was earlier referred to as BG197 and later appeared in inventory as `BG 202 - Shared Team Context Cache Reader v1`. Governance, health, learning, ownership, successor mapping and cost attribution must join by scenario ID, not by BG alias.

Canonical prevention rule: `stable-scenario-identity-v1`.

## Cost/transfer evidence while quota-paused

Read-only inventory at the time of the pause exposed these large cumulative footprints in the active set:

| Scenario | ID | Credits | Data transfer (bytes) | Notes |
| --- | ---: | ---: | ---: | --- |
| Mission Control API | `7071153` | 14,509 | 942,293,449 | instant webhook read endpoint |
| Signal Fusion Engine | `7036518` | 4,183 | 78,995,448 | scheduled |
| Learning Ledger | `7135971` | 4,204 | 13,436,771 | on-demand learning writer |
| Shared Context Projection | `7136045` | 2,427 | 43,724,549 | expensive projection refresh |
| Runtime Sentinel | `7093968` | 1,060 | 46,244,531 | scheduled health audit |

These values identify investigation priority; they do not by themselves prove which account limit caused the pause or that one scenario is the sole root cause.

## BG139 Mission Control containment priority

BG139 (`7071153`) is cache-first but still expensive at high request volume:

1. webhook receives each read;
2. Make Data Store is read on every request;
3. cached Mission Control JSON is returned when usable;
4. cache misses call BG190 (`7152387`);
5. BG190 may read three Notion data sources, construct the payload, and write through cache.

The cached payload includes content, actions, opportunity signals, metrics and revenue information. Cache-first architecture does not eliminate cost when `request frequency x response bytes` is large.

Canonical prevention rule: `read-cost-frequency-times-payload-v1`.

Before changing response fields, determine actual consumers and preserve contract compatibility. First measure:

- requests per minute/hour/day;
- bytes per response;
- cache-hit ratio;
- BG190 fallback frequency;
- frontend/portal polling cadence;
- duplicate or concurrent polling sources.

Prefer reducing duplicate polling and request frequency before deleting useful payload data.

## Quota recovery sequence

Canonical prevention rule: `quota-recovery-no-blind-resume-v1`.

When Make becomes execution-eligible again:

1. identify whether the exceeded limit was operations, data transfer, or both from Make account/billing evidence;
2. do not blindly resume all scheduled/webhook traffic;
3. confirm highest-cost readers/writers from current inventory;
4. run one bounded canary for the learning plane;
5. verify BG166 fingerprint dedupe and the 60-minute BG167 refresh reservation;
6. measure BG139 request rate, response size and cache/fallback behavior;
7. implement the smallest compatible containment fix;
8. verify before/after operations, credits and transfer;
9. only then remove emergency containment and close the recovery obligation.

## Learning plane protections to preserve

- BG166 (`7135971`) is the append-only learning writer and canonical dedupe owner.
- BG167 (`7136045`) is projection-refresh only; ordinary non-BG166 calls must not reach the expensive rebuild path.
- BG168 (`7136176`) routes material outcomes to BG166 and must remain fail-open relative to primary agent work.
- scenario `7165044` is the dedicated shared-context cache reader, regardless of its mutable BG alias/name.
- BG169 (`7137190`) remains production authority.
- BG167 projection refresh is cost-coalesced to an hourly reservation during cost-recovery mode.

## Retired label-cleanup attempts

BG166 module 12 still has a historical visible label referring to a `10s` window. The live mapper is authoritative and uses:

- key bucket `YYYYMMDDHH`;
- `window_seconds=3600`;
- cost-recovery mode;
- a two-hour reservation record expiry.

Two attempted label-only repair paths are retired unless Make editor capabilities change:

1. `set_module_config` accepted the update but did not change the existing module label; it was a no-op for the label.
2. atomic remove/recreate of module 12 plus its error handler could not be expressed safely because the replacement module ID is assigned after patch application, so the error handler cannot target it in the same transaction.

Do not modify the proven 3600-second mapper merely to make the visible label agree.

## Open obligation

GitHub issue `#741` is the durable recovery owner while Make cannot accept runtime learning writes. Keep it open until:

- Make account/team execution eligibility is restored;
- the exceeded limit is identified;
- BG139 containment is measured and implemented where justified;
- bounded post-recovery canaries are green;
- cost/transfer evidence demonstrates improvement;
- the learning plane can write and project new lessons again without a credit/transfer storm.
