# Instagram canonical Graph user ID binding — 2026-09-27

Canonical Bedrijfsgeheugen Instagram publishing identity is `@bedrijfsgeheugen.nl` with Instagram Graph User ID `17841446582493753`.

The previous runtime resolved identity through `ig_user_id=me`, which made identity depend on whichever Instagram account the OAuth connection selected. All known legacy connections resolved to `@arthurprinsen` / `28328860976766075`.

The publisher now probes each candidate Composio connection against the explicit canonical Graph User ID before publication authority is consumed. A connection is eligible only when provider readback proves both the canonical ID and canonical username. Create and publish calls use the canonical Graph User ID explicitly. No Buffer, direct-Meta or Make fallback is allowed.

If the Composio OAuth token cannot access `17841446582493753`, the daily Reel remains recoverable and unpublished until the correct connection is available.
