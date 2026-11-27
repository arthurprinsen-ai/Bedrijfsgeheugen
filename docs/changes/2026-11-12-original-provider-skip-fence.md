# 12 Nov 2026 — Real provider posts cannot be recorded as skipped

Production source for the existing `record_content_publication_skip` was missing a side-effect check: only `status` blocked `SKIPPED`. A posted Instagram media ID with provider truth and even an original live timestamp could therefore remain `SKIPPED`, poisoning the original BRAIN handoff as `OVERDUE_PUBLICATION`.

**Original source proof (connected Instagram business account)**: 17883673467686532 on 2026-09-23T10:33:52Z and 18060985460558066 on 2026-10-02T10:25:23Z, plus 18193272064401728, 18105956765257858 and 17992107825115789. All five were read from the original provider with matching owner 28537384955950341, exact media ID, URL and timestamp. Supabase original source records were updated by bounded identity-matched updates; no post was newly published or resent.

**Preventive change:** same original `record_content_publication_skip` now refuses NO_PUBLISH if an external provider ID exists, either publication timestamp exists, or stored/incoming provider proof flags an actual side effect. Keep the original `23514` fail-closed error, original row lock, unchanged tenant and service-role authority. An ambiguous provider write must be reconciled from the same original publisher, not retried or overwritten with SKIPPED.

**Learning:** post existence does not make a 24/48/72-hour metric verifiable. Independently collect exact-window provider metrics, evaluate and hand off to ONE BRAIN, apply on a later proved publication, then close source-bound obligations. Missing historic metrics stay open rather than being synthesized or inferred from today's lifetime metrics.

**Acceptance:** test `tests/brain-original-no-publish-provider-side-effect-20261112.test.mjs`, protected CI/CodeQL, Supabase function runtime readback exact new guard, native original scheduler and publication records unchanged except source-backed corrections. Do not launch a new scheduler or provider sender.
