# Social provider-write terminal invariant

Date: 2026-09-28  
Fingerprint: `social-provider-write-terminal-v1`

## Purpose

A provider-created social post must never be converted back into an unpublished/blocked state because a later readback, token, ACL, media-proof or identity-proof check fails.

The system now separates:
- **provider-write truth**: the external provider accepted the write and returned a durable post/media ID;
- **verification enrichment**: API readback, ACL inspection, token health, media proof, analytics or public-page confirmation performed after the write.

Provider-write truth is terminal for anti-duplicate purposes.

## Channel rules

### LinkedIn personal
A successful create call with a durable personal post URN closes the obligation as published. Later token revocation or 401/403 readback cannot reopen the claim.

### LinkedIn company
A successful create call with a durable organization post URN closes the obligation as published. Read/admin permission limits cannot negate it.

### Instagram company
A successful media publish with a durable media ID closes the obligation as published. Later media-proof drift or stricter future Mira/media gates applies prospectively, not retroactively.

## Watchdog contract

Daily reconciliation may enrich provider truth, collect metrics, repair future capability, or mark readback as permission-limited. It may not:
- issue a replacement post for an existing external ID;
- downgrade a provider-created claim to BLOCKED merely because later verification fails;
- request repeated OAuth reconnect solely to verify an existing provider side effect.

Durable external IDs are permanent anti-duplicate fences.
