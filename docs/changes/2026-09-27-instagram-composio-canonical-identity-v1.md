# Instagram Composio canonical identity recovery — 2026-09-27

## Incident
The social publisher could discover multiple ACTIVE Composio Instagram connections whose aliases suggested Bedrijfsgeheugen, while provider readback resolved all of them to `@arthurprinsen`. Meta Business Suite independently showed that `@bedrijfsgeheugen.nl` exists as a business asset with full access.

## Root cause
The runtime deduplicated Instagram credentials primarily by provider ID and alias/default metadata. It did not require the provider username to equal the canonical Bedrijfsgeheugen username before consuming publication authority. The Instagram lane also still contained direct-Meta and Buffer fallback paths.

## Fix
- Instagram publication is now Composio-only.
- Canonical username is `bedrijfsgeheugen.nl`.
- Provider identity is read through `INSTAGRAM_GET_USER_INFO` before publication authority is consumed.
- Any other username, including `arthurprinsen`, fails closed.
- The numeric provider Instagram user ID is passed explicitly to container creation and media publish.
- Composio calls use structured tool arguments instead of natural-language mutation instructions.
- Instagram no longer falls back to Buffer or direct Meta.
- Identity/auth failures preserve the same exact proven Reel in a recoverable state.

## Operational requirement
A connection being ACTIVE, BUSINESS, default, or named `bedrijfsgeheugen-*` is not identity proof. Only provider readback of username `bedrijfsgeheugen.nl` is sufficient for the Bedrijfsgeheugen Instagram lane.
