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


## Database enforcement

The same terminality rule is enforced below the Edge Function layer.

Migration: `supabase/migrations/20260928122000_social_provider_write_terminal_reconcile_v1.sql`.

It changes the canonical outcome reconciler and both Instagram obligation triggers so that:
- provider-created external IDs are terminal side effects;
- `powerhouse_reconcile_content_outcomes_v1` restores/keeps `PUBLISHED` for provider-created LinkedIn and Instagram claims;
- the Instagram exact-final-media and vision triggers remain fail-closed **before** provider write;
- after provider write, missing media/vision proof becomes a prospective quality control and cannot retroactively set the existing post to `BLOCKED`;
- the existing provider ID stays the permanent anti-duplicate fence.

Production replay for 2026-09-28 returned `blocked_count=0` after this database contract was applied.
