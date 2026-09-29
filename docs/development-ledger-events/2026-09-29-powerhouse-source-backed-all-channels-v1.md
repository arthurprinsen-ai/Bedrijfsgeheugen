# 2026-09-29 — Powerhouse source-backed all-channel loop v1

Fingerprint: `powerhouse-source-backed-all-channels-v1`

Material change: the evidence-first source loop is no longer Instagram-only. The same canonical lineage is now applied to Instagram, LinkedIn personal, LinkedIn company, blog, email and LinkedIn DM while preserving each channel's identity/truth rules.

Canonical lineage:
`SOURCE -> EVIDENCE -> DEDUPE -> PROBLEM/TRIGGER -> CHANNEL FIT -> CANDIDATE -> IDENTITY/TRUTH GATE -> PUBLISH/SEND -> PROVIDER READBACK -> OUTCOME -> LEARNING -> NEXT SELECTION`.

Production evidence recorded during delivery:
- Mira source radar: 24 signals stored, 12 eligible; 2026-09-30 winner is source-backed with score 0.857.
- Universal outbound lineage refresh returned 61 lineages.
- LinkedIn personal current recommendation is marked source-backed while preserving verified Arthur truth; public complaint evidence is inspiration-only and cannot manufacture personal experience.
- LinkedIn company and blog now have explicit source-backed candidates from current external MKB evidence; blog also retains search-intent/cannibalization controls.
- Direct email/LinkedIn-DM actions now pass a traceable-source + person/company context gate; unbacked pending actions fail closed as skipped with send_forbidden=true.
- Content orchestrator materializes source-backed candidates before selection and prefers them over calendar/evergreen fallback.
- Skills, Brain learning, quality surface registry and source registry were updated in the same lineage.

Outcome contract: social metrics, replies, sales outcomes, orders and revenue remain attached to source/action/recommendation lineage and feed subsequent selection.

Delivery metadata readback: PR #3374 is bound to obligation `powerhouse-source-backed-all-channels-v1`, backend implementation lane, with immutable base SHA `5dea11c020209d753d17563a2ba4b31639e0b69f`.
