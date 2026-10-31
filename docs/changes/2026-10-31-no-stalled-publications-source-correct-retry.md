# Powerhouse / ONE BRAIN — no stalled posts, blog or authorized email

**Observed in production (2026-10-31, Europe/Amsterdam).** Content obligations on the original day remain PLANNED without any independent public/provider IDs. The existing gpt-5-mini text generator recorded 429 `PROVIDER_BILLING` for blog and two LinkedIn channels. The canonical source `daily-publication-recovery.mjs` already classified billing correctly **after a missed deadline**, but prior to the deadline still returned PENDING_PROOF because `isFailed` did not inspect the persisted generation error. This wastes recovery time and contradicts continuous recovery.

## Minimal original-lineage correction

- Classify a persisted provider-generation billing failure as actionable `RECOVERY_DUE` **immediately**, not after the 30-minute deadline grace window.
- Distinguish `EARLY_RECOVERY` from `MISSED_DEADLINE` in the original private ONE BRAIN guard receipt and portal. Do not call the first case a missed publication or a completed retry.
- Expose a bounded, non-executable `repairHandoff` for each problem: restore authorized approved generation capability and **regenerate**, obtain a genuinely different dated/source-verified story, prove Mira identity/media, restore original blog editorial release, prove original email sender+opt-in+suppression, or reconcile external provider side effects before same-obligation idempotent retry.
- Continue the already scheduled canonical content-orchestrator and publisher in exactly one original lease. No alternative provider, scheduler, email sender or duplicate attempt. No automatic OpenAI credit purchase / OAuth consent / waiver of strict identity or private blog security gates.
- Failed/incorrect content must be corrected or rebuilt before any publisher attempt. A provider create/ACK already confirmed is immutable, even if later readback temporarily fails. Unknown side effect requires original provider reconciliation first. Independently verify exact provider ID/public URL and outcome before closing.
- Preserve incident fingerprint `powerhouse|publication|predeadline-provider-billing-failure-not-immediate|20261031-v1` as OBSERVED; promote only after protected CI, original production deployment parity, and natural original run prove early detection. Success of the classifier is not publication success.

## Regression and independent evidence

`tests/brain-daily-publication-no-silent-gap-20261031.test.mjs` exercises early provider billing, native Postgres Date deadlines, correct late classification, safe handoff without leaking provider secrets, honest portal states, and no duplicate when a real provider ID exists.

Original P0 owner: [issue #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Protected GitHub CI plus source parity, existing Edge normal-run result and real external provider receipt are required before claims of production success.

**Release admission:** the protected delivery-hygiene workflow must bind this candidate to the current immutable main base, original P0 obligation, one canonical backend recovery lane, seven changed paths and one exclusive writer lease. A PR metadata failure is not code-test success. Do not bypass admission.
