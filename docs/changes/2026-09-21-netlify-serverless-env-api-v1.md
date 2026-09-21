# Netlify serverless environment API correction

Date: 21 September 2026  
Fingerprint: `netlify-serverless-env-api-v1`

## Problem

The Composio secret bridge was deployed as a Netlify serverless Function, but it read environment variables through `Netlify.env`. The production secret itself was already correctly configured with production context and Functions/runtime scopes.

## Root cause

`Netlify.env` is the Edge Functions environment API. Netlify serverless Functions expose scoped environment variables through `process.env`.

## Repair

The bridge now reads `COMPOSIO_API_KEY`, `BG_PORTAL_EU_SUPABASE_URL`, and `BG_PORTAL_EU_SERVICE_TOKEN` through `process.env`. Existing idempotent status-first behavior, secret non-disclosure, scheduled execution, deploySucceeded activation, and publication ownership remain unchanged.

## Verification

Terminal success requires exact-head gates, protected merge, production deploy, platform deploy-event execution, Supabase `api_key_present=true`, and Composio setup readback without exposing secret material.
