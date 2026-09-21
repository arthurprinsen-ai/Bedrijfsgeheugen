# Composio cross-runtime secret binding

Date: 21 September 2026  
Fingerprint: `composio-cross-runtime-secret-binding-v1`

## Problem

The Composio API key was configured in Netlify production, while the canonical Instagram publisher runs in Supabase. Netlify secrets are not automatically visible to Supabase, so the direct Composio route remained blocked even though the operator had already configured the key.

## Repair

A scheduled Netlify serverless function now owns the cross-runtime binding. It reads the existing Netlify `COMPOSIO_API_KEY` only at runtime and calls the existing authenticated Supabase onboarding function using `BG_PORTAL_EU_SERVICE_TOKEN`.

The bridge first asks Supabase for status. If the key is already present, it performs no write. If absent, it calls `set_api_key`, which validates the key against Composio before storing it through the canonical Supabase RPC. Secret values are never returned or logged.

## Schedule

The sync runs daily at 04:17 UTC, before the normal daytime publishing window in Europe/Amsterdam. The existing five-minute content closed loop remains the sole publication/recovery owner.
