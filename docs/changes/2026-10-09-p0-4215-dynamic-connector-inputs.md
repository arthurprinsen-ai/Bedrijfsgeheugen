# P0 #4215 — dynamic field enumeration and lost connector edits

## Observed root cause
In `portal-next/connector-builder-view.js` user-facing source JSON and per-mapping target inputs existed, but `portal-next/connector-builder-element.js` ignored their change events. Saving connector drafts would silently persist stale configuration/mapping values. The canonical field matrix also counted the native AI-capability editor as two aggregate paths despite 86 independently editable scores and 86 provenance flags; the external connector editor had no selector-level inventory. The pure compliance input adapter was incorrectly treated as an undiscovered writable form instead of an adapter requiring a separate whole-page audit.

## Bounded repair
- Repair the existing connector event handling for source JSON and mapping target; reject malformed JSON and invalid row indices without corrupting previous draft state. Preserve existing `/api/connectors` provider authority and `saveDraft` lifecycle; do not create a second database, queue or Brain.
- Enumerate every score and scan provenance leaf from the existing immutable `AI_CAPABILITY_CATALOG` registry (86 + 86, with expected source `ai-capabilities`).
- Export provider form selectors from the existing rendered connector view (10 selector types including ephemeral safe-test input), inventory them separately and validate existence. Distinguish per-row path templates, source provider authority, test-only data and proof requirements from canonical customer BusinessInput paths. No fake tenant ACK.
- Recognize that `compliance-input-adapter.js` itself is a read-only projection, not a customer editor; do not claim the entire compliance page is read-only without authenticated DOM inspection.
- Add deterministic regressions for 172 AI leaf paths, ten connector selector declarations and actual onChange failure cases.

## Verification
`node tools/ci/p0-4215-portal-input-coverage-matrix.mjs`
`node --test tests/brain-p0-4215-input-surface-coverage-v1.test.mjs`

## Limitations
Source/renderer test success does not prove authenticated connector provider roundtrip, two isolated customers, all legacy DOM controls, repeatable runtime-row binding, transactional outbox/Brain ACK, persisted updated page cards or official tenant-specific CSRD/ESRS applicability. Parent #4215 remains open until independently verified. Protected main merge and exact Netlify production commit require separate readback.

## Main-epoch CI reconciliation
The first protected PR preflight passed the 199 supplemental paths and all 10 input-event tests, then found a separately merged source/test race: the mandatory scoped production visual replay test was not present at the old base. Rebuild the same eight-file bounded patch over the protected current main that already contains this mandated test; do not duplicate or bypass it. The missing test belongs to the canonical current main infrastructure. Correct matrix dynamic-surface summary to count only genuinely unenumerated dynamic surfaces rather than separate-authority selector declarations.
