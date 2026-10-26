# Development ledger event: POWERHOUSE ∞ Action Fabric digest repair

- Date: 2026-10-08
- Obligation: `powerhouse-infinity-action-fabric-digest-20261008-v1`
- Trigger: live cycle receipt exposed `function digest(bytea, unknown) does not exist`
- Change: qualify pgcrypto schema and fail closed before canonical materialization
- Evidence: migration, contract test, protected CI, production action reference and live cycle receipt
- Production state: pending protected delivery and readback
