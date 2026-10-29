# Mira — reject-proof monotonicity and historical recovery (2026-10-29)

**Incident:** existing parent #4439; original provider media job d84f2b1d-7e3e-4396-86b0-90a9072ef37f; OpenArt history i6e9teMFpPH7YwZG4PMS. External Instagram provider ID is absent.

**Independently measured:** the exact completed OpenArt candidate was rejected on video first frame with Mira face-confidence 0.900, below mandatory 0.940. Protected PR #5128 recovery was production-proven at ~15:06 UTC (GENERATING -> WAITING_PROOF with precise rejection). At 15:09 UTC a second readiness preflight caused a regression: WAITING_PROOF -> WAITING_ASSET, cleared last_error and next_action, attempts remained 1. No new asset, proof or provider post occurred.

**Root cause:** router index.ts derived WAITING_ASSET from missing approved asset_url, even when source history was already rejected. writeMediaPreflight honored that new row; the preserved-failure helper also required a materialized asset URL to protect rejection. Historical ONE BRAIN recovery only allowed prior status GENERATING. This created silent diagnostic erasure and stuck retries.

**Fix candidate:** preflight-write.mjs prohibits any readiness poll from erasing an exact proof rejection while the job is WAITING_PROOF. When legacy regression already erased rejection and status is WAITING_ASSET or WAITING_PROVIDER_CONNECTION, the original preflight rehydrates the *same* source-history rejection from verified immutable ONE BRAIN occurrence, with status and updated_at CAS. It never writes provider ID, modifies attempt counter, trusts caller-provided rejection, repeats paid verification or changes thresholds. No new executor, scheduler, publisher, preview or cost.

**Verify:** tests/brain-mira-rejected-proof-preflight-regression-20261029.test.mjs; existing protected Required/BRAIN/CodeQL; protected merge and Supabase deployed-source readback; actual idempotent same-job production preflight twice, ensuring persisted WAITING_PROOF and rejection are unchanged on second run. No production claim until evidence. Social day remains RED until personal LinkedIn and Instagram own real provider ID and independent readback; blog unchanged. No historical content reused.

**Learning:** .agents/skills/powerhouse-social-recovery-cooperation/SKILL.md; docs/development-ledger-events/2026-10-29-mira-preflight-rejection-regression.md; brain/learning/2026-10-29-mira-preflight-rejection-monotonicity-v1.json. Once merged, 7-day soak before maturity PROVEN.
