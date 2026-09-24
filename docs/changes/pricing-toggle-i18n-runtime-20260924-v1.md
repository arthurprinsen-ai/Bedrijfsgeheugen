# Pricing toggles and language runtime — 2026-09-24 v1

## Root cause

Two production checks were too shallow. The pricing proof verified that toggle markers existed in HTML, but did not prove that clicking changed visible state. The language selector on unprefixed public pages navigated to `/en/*`, making a language switch dependent on a separate localized route being reachable.

## Fix

- Pricing route, plan and billing controls now force both semantic state (`hidden`, ARIA) and visible state (`style.display`) through the delegated rescue runtime.
- The pricing runtime is cache-busted to `20260924-0750`.
- Public unprefixed pages switch NL/EN in place using the existing translation runtime and persist the selected locale.
- Dynamically inserted content is translated whenever runtime locale is English, without requiring an `/en/*` pathname.
- Production proof now requires the new pricing runtime asset version.

## Prevention

Presence-only HTML checks are not sufficient for interactive controls. Interaction state and language behavior are locked with regression tests and production asset readback.
