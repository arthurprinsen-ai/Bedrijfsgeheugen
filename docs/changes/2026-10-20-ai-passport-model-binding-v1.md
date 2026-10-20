# Dynamic tenant AI passport and model choice

Obligation: portal-ai-passport-model-binding-20261020-v1.
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4152.
Fingerprint: portal|ai-passport|tenant-model-choice-live-projection|v1.

The existing private Data & AI Passport projects the tenant's default model, requested provider routes, workload assignments, purpose and timestamps next to authenticated model-specific governance records and the existing server activation checklist. Data categories, processing, retention, training, transfers, subprocessors and review dates come from the sovereignty API. Provider storage facts remain on the same page.

The existing domainState → BusinessInput → organism writeback remains the persistence authority; the existing sovereignty Heartbeat remains the periodic provider refresh authority. Existing canonical runtime updates and focus/visibility events revalidate the read-only view. No extra scheduler, store, inference route, credential provisioning or provider activation is introduced. Even administrators use their own tenant evidence for their model preferences; the separate security view retains its existing canonical admin scope.

Saved preference, registered route, readiness for a manual test and verified real execution are separate states. Pending saves suppress readiness; save ACK triggers readback even if the page opened during saving. Authoritative evidence events force/coalesce a read, including one follow-up during an in-flight request. Passive reads are throttled to 30 seconds; requests have 15-second cancellation. Identity changes clear data and navigation disposes listeners, aborts reads and rejects late results.

Review found and corrected lost evidence notifications, readiness before save ACK and mount-during-save handling. All nine final behavioral cases passed in V8 against the exact source. Initial remote Node verification passed 18 targeted tests and 586 portal tests before review amendments. The final native repeat was interrupted by remote execution transport time-outs and remains a required exact-head CI gate. Wider unchanged-base comparison reproduced four existing failures: System Map topology, admin observability tab, legacy trust links and one-Portal legacy surface.

Regression cases are included through the already registered model-choice CI lane. No release/security gates are weakened.

Delivery status: SOURCE_CANDIDATE, not production proven. Protected merge, exact deployment identity and authenticated same-tenant functional readback remain required. This change does not establish whole-system acceptance.

Admission recovery: Required run 39468083173 rejected the initial noncanonical test filename. The same behavioral regression was renamed to tests/brain-portal-ai-passport-model-binding-v1.test.mjs, retaining historical/shadow/canary evaluation and both CI imports. The gate remains unchanged.
