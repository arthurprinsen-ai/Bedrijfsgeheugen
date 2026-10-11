# Continuous commercial publication execution

Date: 11 October 2026. Parent P0: #4198.

## Operational failure
An error in outcome reconciliation prevented the existing scheduled content-loop from running, affecting otherwise independent publication channels.

## Production correction
The existing canonical scheduled job now runs every hour, day and night. The existing database launcher records a reconciliation failure separately and still dispatches the canonical publishing loop. Original authentication and publication authorization controls remain unchanged. No new schedule or sender is introduced.

## Verification
Production readback: one active job, hourly schedule, same function owner, same function access controls and authentication gate. This proves the scheduler changes, not actual publication, message delivery or revenue.

## Source and tests
Migration: supabase/migrations/20261011110000_powerhouse_content_reconciliation_isolation_always_on_v1.sql.
Regression: tests/brain-commercial-content-continuity-v1.test.mjs.

## Protected production source registration

The canonical content generator was missing from supabase/config.toml even after its source was merged to main in PR #4316. It has now been registered with the same in-function token authentication (verify_jwt=false). The existing provider-source parity workflow must prove exact production deployment; an attestation that checked other functions does not constitute proof for this generator. Publication remains unproven until provider-side verification.
